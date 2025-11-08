import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass, DatePipe } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [CommonModule, NgClass, DatePipe]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  unreadCount = 0;
  markingAll = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.fetchNotifications();
    this.fetchUnreadCount();
  }

  fetchNotifications() {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
        this.fetchUnreadCount();
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
        this.fetchUnreadCount();
      }
    });
  }

  markAsRead(notification: Notification) {
    if (notification.read) return;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.fetchUnreadCount();
      }
    });
  }

  fetchUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => (this.unreadCount = count),
      error: () => (this.unreadCount = 0)
    });
  }

  markAllAsRead() {
    this.markingAll = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.fetchUnreadCount();
        this.markingAll = false;
      },
      error: () => {
        this.markingAll = false;
      }
    });
  }
}
