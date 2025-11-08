import { Component, OnInit } from '@angular/core';
import { MessageService, SendMessageRequest } from '../services/message.service';

export class ProductDetailsComponent implements OnInit {
  showMessageDialog = false;
  messageContent = '';
  currentUserId: number | null = null;

  constructor(
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getUserId(); // Use your auth service method
  }

  getUserId(): number | null {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).userId;
    }
    return null;
  }

  isOwner(): boolean {
    return this.currentUserId === this.product?.seller?.userId;
  }

  openMessageDialog(): void {
    if (!this.currentUserId) {
      alert('Please login to send a message');
      return;
    }
    this.showMessageDialog = true;
  }

  closeMessageDialog(): void {
    this.showMessageDialog = false;
    this.messageContent = '';
  }

  sendMessage(): void {
    if (!this.messageContent.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!this.currentUserId || !this.product) {
      return;
    }

    const request: SendMessageRequest = {
      receiverId: this.product.seller.userId,
      productId: this.product.productId,
      content: this.messageContent
    };

    this.messageService.sendMessage(this.currentUserId, request).subscribe({
      next: (response) => {
        alert('Message sent successfully! The seller will be notified via email.');
        this.closeMessageDialog();
      },
      error: (error) => {
        alert('Failed to send message: ' + (error.error || 'Unknown error'));
      }
    });
  }
}