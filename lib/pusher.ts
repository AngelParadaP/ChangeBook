import PusherServer from "pusher";

// ⚠️  Solo instancia del SERVIDOR.
// Para el cliente usa @/lib/pusher-client (browser-only)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});
