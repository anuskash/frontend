import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConversationResponse } from '../services/message.service';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  conversations: ConversationResponse[] = [];
  unreadCount = 0;
  currentUserId: number | null = null;
  loading = false;

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getUserId();
    if (this.currentUserId) {
      this.loadConversations();
      this.loadUnreadCount();
    } else {
      this.router.navigate(['/login']);
    }
  }

  getUserId(): number | null {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).userId;
    }
    return null;
  }

  loadConversations(): void {
    if (!this.currentUserId) return;
    
    this.loading = true;
    this.messageService.getConversations(this.currentUserId).subscribe({
      next: (data) => {
        this.conversations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load conversations', error);
        this.loading = false;
      }
    });
  }

  loadUnreadCount(): void {
    if (!this.currentUserId) return;
    
    this.messageService.getUnreadCount(this.currentUserId).subscribe({
      next: (count) => this.unreadCount = count,
      error: (error) => console.error('Failed to load unread count', error)
    });
  }

  openConversation(conv: ConversationResponse): void {
    this.router.navigate(['/conversation'], {
      queryParams: {
        userId: conv.otherUserId,
        productId: conv.productId
      }
    });
  }
}
