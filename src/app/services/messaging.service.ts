import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConversationDTO, MessageDTO, SendMessageRequest } from '../models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private base = environment.baseUrl;
  private ep = environment.endpoints.messaging;
  private _unreadCount$ = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount$.asObservable();

  constructor(private http: HttpClient) {}

  sendMessage(senderId: number, body: SendMessageRequest): Observable<MessageDTO> {
    const url = `${this.base}${this.ep.send}`;
    const params = new HttpParams().set('senderId', String(senderId));
    return this.http.post<MessageDTO>(url, body, { params });
  }

  getConversations(userId: number): Observable<ConversationDTO[]> {
    const url = `${this.base}${this.ep.conversations}`;
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<ConversationDTO[]>(url, { params });
  }

  getConversationMessages(userId: number, otherUserId: number, productId: number): Observable<MessageDTO[]> {
    const url = `${this.base}${this.ep.conversation}`;
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('otherUserId', String(otherUserId))
      .set('productId', String(productId));
    return this.http.get<MessageDTO[]>(url, { params });
  }

  getUnreadCount(userId: number): Observable<number> {
    const url = `${this.base}${this.ep.unreadCount}`;
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<number>(url, { params });
  }

  markAsRead(userId: number, messageId: number): Observable<string> {
    const url = `${this.base}${this.ep.markRead.replace('{messageId}', String(messageId))}`;
    const params = new HttpParams().set('userId', String(userId));
    return this.http.put(url, null, { responseType: 'text', params });
  }

  /**
   * Convenience method to fetch unread count and broadcast to navbar listeners.
   */
  refreshUnreadCount(userId: number): void {
    this.getUnreadCount(userId).subscribe({
      next: (count) => this._unreadCount$.next(count || 0),
      error: () => this._unreadCount$.next(0)
    });
  }
}
