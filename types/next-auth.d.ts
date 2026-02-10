import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Agrega otros campos si los necesitas (rol, etc.)
    } & DefaultSession["user"];
  }
}
