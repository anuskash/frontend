import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MessageResponse, SendMessageRequest } from '../services/message.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewChecked {
  messages: MessageResponse[] = [];
  newMessage = '';
  currentUserId: number | null = null;
  otherUserId!: number;
  productId!: number;
  otherUserName = '';
  productTitle = '';
  loading = false;
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  private shouldScroll = false;

  constructor(
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getUserId();
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.otherUserId = +params['userId'];
      this.productId = +params['productId'];
      if (this.otherUserId && this.productId) {
        this.loadMessages();
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  getUserId(): number | null {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).userId;
    }
    return null;
  }

  loadMessages(): void {
    if (!this.currentUserId) return;

    this.loading = true;
    this.messageService.getConversationMessages(
      this.currentUserId,
      this.otherUserId,
      this.productId
    ).subscribe({
      next: (data) => {
        this.messages = data;
        if (data.length > 0) {
          const firstMsg = data[0];
          this.otherUserName = firstMsg.senderId === this.currentUserId 
            ? firstMsg.receiverName 
            : firstMsg.senderName;
          this.productTitle = firstMsg.productTitle;
        }
        this.shouldScroll = true;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load messages', error);
        this.loading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentUserId) return;

    const request: SendMessageRequest = {
      receiverId: this.otherUserId,
      productId: this.productId,
      content: this.newMessage.trim()
    };

    this.messageService.sendMessage(this.currentUserId, request).subscribe({
      next: (response) => {
        this.messages.push(response);
        this.newMessage = '';
        this.shouldScroll = true;
      },
      error: (error) => {
        alert('Failed to send message: ' + (error.error || 'Unknown error'));
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  goBack(): void {
    this.router.navigate(['/inbox']);
  }
}
