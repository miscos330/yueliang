import request from './request';

export interface Conversation {
  id: number;
  fanId: number;
  fanNickname: string;
  fanAvatar?: string | null;
  fanOnline: boolean;
  csId?: number | null;
  lastMsg?: string | null;
  lastMsgAt?: string | null;
  unread: number;
}

export interface Message {
  id: number;
  conversationId: number;
  fromType: string; // fan | cs
  fromId?: number | null;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  csId?: number | null;
  fanId?: number | null;
}

export function getConversations() {
  return request.get('/chat/conversations') as Promise<Conversation[]>;
}
export function getMessages(conversationId: number) {
  return request.get(
    `/chat/conversations/${conversationId}/messages`,
  ) as Promise<Message[]>;
}
export function markRead(conversationId: number) {
  return request.post(`/chat/conversations/${conversationId}/read`) as Promise<{
    success: boolean;
  }>;
}
