import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as apiLogin, getProfile } from '@/api/auth';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role: string;
  avatar?: string;
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('yl_token') || '');
  const storedUser = localStorage.getItem('yl_user');
  const user = ref<UserInfo | null>(storedUser ? JSON.parse(storedUser) : null);

  async function login(username: string, password: string) {
    const data = await apiLogin(username, password);
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('yl_token', data.token);
    localStorage.setItem('yl_user', JSON.stringify(data.user));
  }

  async function fetchProfile() {
    user.value = await getProfile();
    localStorage.setItem('yl_user', JSON.stringify(user.value));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('yl_token');
    localStorage.removeItem('yl_user');
  }

  return { token, user, login, fetchProfile, logout };
});
