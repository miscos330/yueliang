import request from './request';

export interface Cs {
  id: number;
  username: string;
  nickname: string;
  role: string; // admin | cs
  status: number; // 1 启用 / 0 禁用
  online: boolean;
  fansCount: number;
  remark?: string | null;
  groupId?: number | null;
  group?: { id: number; name: string } | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CsGroup {
  id: number;
  name: string;
  remark?: string | null;
  memberCount?: number;
  createdAt: string;
}

export interface CsQuery {
  keyword?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}

// ===== 账号 =====
export function getCsList(params: CsQuery) {
  return request.get('/cs', { params }) as Promise<{
    list: Cs[];
    total: number;
    page: number;
    pageSize: number;
  }>;
}
export function createCs(data: Record<string, unknown>) {
  return request.post('/cs', data) as Promise<Cs>;
}
export function updateCs(id: number, data: Record<string, unknown>) {
  return request.patch(`/cs/${id}`, data) as Promise<Cs>;
}
export function deleteCs(id: number) {
  return request.delete(`/cs/${id}`) as Promise<{ success: boolean }>;
}
export function resetCsPassword(id: number, password: string) {
  return request.post(`/cs/${id}/reset-password`, { password }) as Promise<{
    success: boolean;
  }>;
}

// ===== 分组 =====
export function getCsGroups() {
  return request.get('/cs-group') as Promise<CsGroup[]>;
}
export function createCsGroup(data: { name: string; remark?: string }) {
  return request.post('/cs-group', data) as Promise<CsGroup>;
}
export function updateCsGroup(id: number, data: { name: string; remark?: string }) {
  return request.patch(`/cs-group/${id}`, data) as Promise<CsGroup>;
}
export function deleteCsGroup(id: number) {
  return request.delete(`/cs-group/${id}`) as Promise<{ success: boolean }>;
}
