export interface SendMessageRequest {
  receiverId: number;
  productId: number;
  content: string;
}

export interface MessageDTO {
  messageId: number;
  senderId: number;
  senderName: string;
  receiverId?: number;
  receiverName?: string;
  productId: number;
  productTitle?: string;
  productImageUrl?: string;
  content: string;
  sentAt: string; // ISO
  isRead: boolean;
}

export interface ConversationDTO {
  otherUserId: number;
  otherUserName: string;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  lastMessage: string;
  lastMessageTime: string; // ISO
  hasUnread: boolean;
  unreadCount: number;
}
