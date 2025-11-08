import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendMessageRequest {
  receiverId: number;
  productId: number;
  content: string;
}

export interface MessageResponse {
  messageId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  receiverId: number;
  receiverName: string;
  receiverEmail: string;
  productId: number;
  productTitle: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  readAt: string | null;
}

export interface ConversationResponse {
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
  productId: number;
  productTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  hasUnread: boolean;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:8080/messages';

  constructor(private http: HttpClient) {}

  sendMessage(senderId: number, request: SendMessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/send?senderId=${senderId}`, 
      request
    );
  }

  getConversations(userId: number): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(
      `${this.apiUrl}/conversations?userId=${userId}`
    );
  }

  getConversationMessages(
    userId: number, 
    otherUserId: number, 
    productId: number
  ): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(
      `${this.apiUrl}/conversation?userId=${userId}&otherUserId=${otherUserId}&productId=${productId}`
    );
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/unread-count?userId=${userId}`
    );
  }

  markAsRead(messageId: number, userId: number): Observable<string> {
    return this.http.put<string>(
      `${this.apiUrl}/${messageId}/mark-read?userId=${userId}`,
      {}
    );
  }
}
