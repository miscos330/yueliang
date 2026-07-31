import request from './request';

export interface Overview {
  miniappCount: number;
  csCount: number;
  todayNewFans: number;
  todayMessages: number;
}

export interface Realtime {
  csOnline: number;
  fansOnline: number;
  todayMessages: number;
  todaySessions: number;
  todayDeletedSessions: number;
}

export interface CsWorkloadItem {
  id: number;
  nickname: string;
  online: boolean;
  fansCount: number;
  remark: string;
  lastLogin: string;
}

export function getOverview() {
  return request.get('/stats/overview') as Promise<Overview>;
}

export function getRealtime() {
  return request.get('/stats/realtime') as Promise<Realtime>;
}

export function getCsWorkload() {
  return request.get('/stats/cs-workload') as Promise<{
    list: CsWorkloadItem[];
    total: number;
  }>;
}
