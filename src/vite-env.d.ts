/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_MOCKS?: 'enabled' | 'disabled';
  readonly VITE_DEFAULT_SCENARIO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
