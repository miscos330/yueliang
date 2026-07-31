/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 生产环境后端接口基址,如 https://xxx.onrender.com/api */
  readonly VITE_API_BASE?: string;
  /** 生产环境 WebSocket 基址,如 https://xxx.onrender.com */
  readonly VITE_WS_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
