import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';
import { MessageService, ConversationResponse, MessageResponse, SendMessageRequest } from '../../services/message.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavbarComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  conversations: ConversationResponse[] = [];
  messages: MessageResponse[] = [];
  activeConv: ConversationResponse | null = null;
  
  conversationsLoading = false;
  conversationsError = '';
  
  messagesLoading = false;
  messagesError = '';
  
  sendContent = '';
  currentUserId: number | null = null;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.currentUserId = this.getUserId();
    if (this.currentUserId) {
      this.loadConversations();
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
    
    this.conversationsLoading = true;
    this.conversationsError = '';
    
    this.messageService.getConversations(this.currentUserId).subscribe({
      next: (data) => {
        this.conversations = data;
        this.conversationsLoading = false;
      },
      error: (error) => {
        this.conversationsError = 'Failed to load conversations';
        this.conversationsLoading = false;
        console.error('Error loading conversations:', error);
      }
    });
  }

  selectConversation(conv: ConversationResponse): void {
    this.activeConv = conv;
    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.currentUserId || !this.activeConv) return;
    
    this.messagesLoading = true;
    this.messagesError = '';
    
    this.messageService.getConversationMessages(
      this.currentUserId,
      this.activeConv.otherUserId,
      this.activeConv.productId
    ).subscribe({
      next: (data) => {
        this.messages = data;
        this.messagesLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        this.messagesError = 'Failed to load messages';
        this.messagesLoading = false;
        console.error('Error loading messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.sendContent.trim() || !this.currentUserId || !this.activeConv) return;
    
    const request: SendMessageRequest = {
      receiverId: this.activeConv.otherUserId,
      productId: this.activeConv.productId,
      content: this.sendContent.trim()
    };

    this.messageService.sendMessage(this.currentUserId, request).subscribe({
      next: (response) => {
        this.messages.push(response);
        this.sendContent = '';
        setTimeout(() => this.scrollToBottom(), 100);
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
    const threadDiv = document.querySelector('.thread .messages');
    if (threadDiv) {
      threadDiv.scrollTop = threadDiv.scrollHeight;
    }
  }
}