import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Notification {
  id: number;
  type: string;
  message: string;
  reason?: string;
  timestamp: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = '/users/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((items) => items.map(item => ({
        id: item.notificationId ?? item.id,
        type: item.type,
        message: item.title || item.message || '',
        reason: item.body || item.reason || '',
        timestamp: item.createDate || item.timestamp,
        read: item.read
      })))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/read-all`, {});
  }
}
