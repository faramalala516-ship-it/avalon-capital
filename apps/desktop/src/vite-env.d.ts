/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AVALON_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
