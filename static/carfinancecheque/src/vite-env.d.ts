/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AFFILIATE_ID: string
  readonly VITE_API_KEY: string
  readonly VITE_KOUNT_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
