import request from './request';

export interface MiniApp {
  id: number;
  name: string;
  appid: string;
  appSecret: string;
  status: number; // 1 启用 / 0 禁用
  csSwitchable: boolean;
  csCount: number;
  remark?: string | null;
  msgTemplate?: string | null;
  token?: string | null;
  encodingAESKey?: string | null;
  adminName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MiniAppQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MiniAppListResult {
  list: MiniApp[];
  total: number;
  page: number;
  pageSize: number;
}

export function getMiniApps(params: MiniAppQuery) {
  return request.get('/miniapp', { params }) as Promise<MiniAppListResult>;
}

export function createMiniApp(data: Partial<MiniApp>) {
  return request.post('/miniapp', data) as Promise<MiniApp>;
}

export function updateMiniApp(id: number, data: Partial<MiniApp>) {
  return request.patch(`/miniapp/${id}`, data) as Promise<MiniApp>;
}

export function deleteMiniApp(id: number) {
  return request.delete(`/miniapp/${id}`) as Promise<{ success: boolean }>;
}

export function batchDeleteMiniApp(ids: number[]) {
  return request.post('/miniapp/batch-delete', { ids }) as Promise<{
    success: boolean;
    count: number;
  }>;
}
