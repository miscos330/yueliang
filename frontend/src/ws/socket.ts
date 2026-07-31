import { io, type Socket } from 'socket.io-client';

// 开发直连本地后端;生产由 VITE_WS_URL 指向后端(如 https://xxx.onrender.com)
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3100';

/** 客服端连接:带 JWT */
export function createCsSocket(token: string): Socket {
  return io(WS_URL, {
    query: { role: 'cs', token },
  });
}

/** 粉丝端连接:带模拟身份 */
export function createFanSocket(params: {
  openid: string;
  nickname: string;
  miniappId?: number;
}): Socket {
  return io(WS_URL, {
    query: { role: 'fan', ...params },
  });
}
