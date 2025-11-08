import { Component, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { ConversationDTO, MessageDTO } from '../../models/messaging.model';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  userId!: number;

  conversations: ConversationDTO[] = [];
  conversationsLoading = false;
  conversationsError = '';

  activeConv: ConversationDTO | null = null;
  messages: MessageDTO[] = [];
  messagesLoading = false;
  messagesError = '';

  sendContent = '';
  pollingSub?: Subscription;
  messagesPollingSub?: Subscription;

  // Contact info for the other user
  otherUserEmail = '';
  otherUserPhone = '';
  loadingContactInfo = false;

  // Auto-scroll management
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  private shouldScrollToBottom = false;

  constructor(
    private auth: AuthService,
    private messaging: MessagingService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const current = this.auth.getCurrentUser();
    if (!current?.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = current.userId;
    this.loadConversations();

    // lightweight polling for unread and conversations list every 60s
    this.pollingSub = timer(60000, 60000).subscribe(() => this.loadConversations(true));
  }

  loadConversations(silent = false) {
    this.conversationsError = '';
    if (!silent) this.conversationsLoading = true;
    this.messaging.getConversations(this.userId).subscribe({
      next: (list) => {
        this.conversations = list || [];
        this.conversationsLoading = false;
        // keep active selection if still present
        if (this.activeConv) {
          const still = this.conversations.find(c => this.sameConv(c, this.activeConv!));
          if (!still) this.activeConv = null;
        }
        // If deep link provided, auto-select
        const otherParam = Number(this.route.snapshot.paramMap.get('otherUserId'));
        const prodParam = Number(this.route.snapshot.paramMap.get('productId'));
        if (otherParam && prodParam) {
          const match = this.conversations.find(c => c.otherUserId === otherParam && c.productId === prodParam);
          if (match) {
            this.selectConversation(match);
          }
        }
      },
      error: (err) => {
        this.conversationsError = 'Failed to load conversations';
        this.conversationsLoading = false;
      }
    });
  }

  selectConversation(c: ConversationDTO) {
    this.activeConv = c;
    // Stop previous active conversation polling
    this.messagesPollingSub?.unsubscribe();
    this.loadMessages();
    this.loadContactInfo();
    // update URL for deep link
    this.router.navigate(['/messages', c.otherUserId, c.productId]);
    // Start real-time polling for active conversation (every 5 seconds)
    this.messagesPollingSub = timer(5000, 5000).subscribe(() => this.loadMessages(true));
  }

  private loadContactInfo() {
    if (!this.activeConv) return;
    this.otherUserEmail = '';
    this.otherUserPhone = '';
    this.loadingContactInfo = true;
    
    this.userService.getSellerInfo(this.activeConv.otherUserId).subscribe({
      next: (user) => {
        this.otherUserEmail = user.email;
        this.otherUserPhone = user.phoneNumber || '';
        this.loadingContactInfo = false;
      },
      error: () => {
        // Fallback email if API fails
        this.otherUserEmail = `${this.activeConv!.otherUserName.toLowerCase().replace(/\s+/g, '.')}@student.uon.edu.au`;
        this.otherUserPhone = '';
        this.loadingContactInfo = false;
      }
    });
  }

  private loadMessages(silent = false) {
    if (!this.activeConv) return;
    this.messagesError = '';
    if (!silent) this.messagesLoading = true;
    this.messaging.getConversationMessages(this.userId, this.activeConv.otherUserId, this.activeConv.productId).subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.messagesLoading = false;
        // Messages are auto-marked as read by backend when fetched
        // Refresh unread count in navbar without reloading entire conversation list
        this.messaging.refreshUnreadCount(this.userId);
        // Scroll to bottom after messages load
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.messagesError = 'Failed to load messages';
        this.messagesLoading = false;
      }
    });
  }

  send() {
    const text = (this.sendContent || '').trim();
    if (!text || !this.activeConv) return;
    this.messaging
      .sendMessage(this.userId, {
        receiverId: this.activeConv.otherUserId,
        productId: this.activeConv.productId,
        content: text
      })
      .subscribe({
        next: (msg) => {
          this.sendContent = '';
          // Optimistically append the new message to the list
          this.messages.push(msg);
          
          // Clear unread status for this conversation since we're actively chatting
          if (this.activeConv) {
            this.activeConv.hasUnread = false;
            this.activeConv.unreadCount = 0;
            // Update the conversation in the list to reflect the cleared unread status
            const convInList = this.conversations.find(c => this.sameConv(c, this.activeConv!));
            if (convInList) {
              convInList.hasUnread = false;
              convInList.unreadCount = 0;
            }
          }
          
          // Refresh navbar unread count
          this.messaging.refreshUnreadCount(this.userId);
          // Scroll to bottom to show the sent message
          this.shouldScrollToBottom = true;
        },
        error: () => {}
      });
  }

  get canSend(): boolean {
    return !!this.activeConv && !!(this.sendContent && this.sendContent.trim().length);
  }

  copyEmailToClipboard() {
    navigator.clipboard.writeText(this.otherUserEmail).then(() => {
      console.log('Email copied to clipboard');
    }, err => {
      console.error('Failed to copy email: ', err);
    });
  }

  copyPhoneToClipboard() {
    navigator.clipboard.writeText(this.otherUserPhone).then(() => {
      console.log('Phone number copied to clipboard');
    }, err => {
      console.error('Failed to copy phone: ', err);
    });
  }

  sameConv(a: ConversationDTO, b: ConversationDTO): boolean {
    return a.otherUserId === b.otherUserId && a.productId === b.productId;
  }

  formatTime(iso: string): string { return new Date(iso).toLocaleString(); }
  
  formatTimeShort(iso: string): string { 
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); 
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (this.isSameDay(iso, today.toISOString())) return 'Today';
    if (this.isSameDay(iso, yesterday.toISOString())) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private isSameDay(a: string, b: string): boolean {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && 
           da.getMonth() === db.getMonth() && 
           da.getDate() === db.getDate();
  }

  isNewDay(index: number): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    const curr = this.messages[index];
    if (!prev || !curr) return false;
    return !this.isSameDay(prev.sentAt, curr.sentAt);
  }

  shouldShowHeader(index: number): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    const curr = this.messages[index];
    if (!prev || !curr) return true;
    // Show header if sender changed OR if it's a new day
    return prev.senderId !== curr.senderId || this.isNewDay(index);
  }

  getAvatarInitials(senderId: number): string {
    if (senderId === this.userId) {
      return 'Me';
    }
    if (!this.activeConv) return 'U';
    const name = this.activeConv.otherUserName || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || 'U')[0].toUpperCase();
  }

  getSenderName(senderId: number): string {
    if (senderId === this.userId) return 'You';
    return this.activeConv?.otherUserName || 'User';
  }

  getConversationInitials(userName: string): string {
    if (!userName) return 'U';
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
    this.messagesPollingSub?.unsubscribe();
  }
}
