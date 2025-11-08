import { Component, OnInit } from '@angular/core';
import { MessageService } from '../services/message.service';

export class NavbarComponent implements OnInit {
  unreadCount = 0;
  private unreadInterval: any;

  constructor(
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
    // Refresh every 30 seconds
    this.unreadInterval = setInterval(() => this.loadUnreadCount(), 30000);
  }

  ngOnDestroy(): void {
    if (this.unreadInterval) {
      clearInterval(this.unreadInterval);
    }
  }

  loadUnreadCount(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const userId = JSON.parse(user).userId;
      this.messageService.getUnreadCount(userId).subscribe({
        next: (count) => this.unreadCount = count,
        error: (error) => console.error('Failed to load unread count', error)
      });
    }
  }
}