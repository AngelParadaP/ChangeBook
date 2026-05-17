"use client";

import PusherClient from "pusher-js";

// Singleton: una sola instancia por tab de browser.
// 'use client' garantiza que este módulo NUNCA se ejecute en el servidor (Vercel / SSR).
let _pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!_pusherClient) {
    _pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );
  }
  return _pusherClient;
}

// Exportamos también la instancia directa para compatibilidad con el código existente
export const pusherClient = getPusherClient();
