import request from './request';

export interface Settings {
  systemName: string;
  welcomeMsg: string;
  assignStrategy: string; // least | round | random
  maxPerCs: string;
  [k: string]: string;
}

export interface QuickReply {
  id: number;
  content: string;
  sort: number;
  createdAt: string;
}

export function getSettings() {
  return request.get('/setting') as Promise<Settings>;
}
export function saveSettings(data: Partial<Settings>) {
  return request.put('/setting', data) as Promise<Settings>;
}

export function getQuickReplies() {
  return request.get('/setting/quick-reply') as Promise<QuickReply[]>;
}
export function createQuickReply(content: string) {
  return request.post('/setting/quick-reply', { content }) as Promise<QuickReply>;
}
export function updateQuickReply(id: number, content: string) {
  return request.patch(`/setting/quick-reply/${id}`, { content }) as Promise<QuickReply>;
}
export function deleteQuickReply(id: number) {
  return request.delete(`/setting/quick-reply/${id}`) as Promise<{
    success: boolean;
  }>;
}
