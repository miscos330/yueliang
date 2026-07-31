import request from './request';
import type { UserInfo } from '@/stores/user';

export function login(username: string, password: string) {
  return request.post('/auth/login', { username, password }) as Promise<{
    token: string;
    user: UserInfo;
  }>;
}

export function getProfile() {
  return request.get('/auth/profile') as Promise<UserInfo>;
}
