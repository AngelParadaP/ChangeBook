// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Kyboo",
      credentials: {
        codigo: { label: "Código", type: "text" },
        nip: { label: "NIP", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.codigo || !credentials?.nip) return null;

        // 1. Buscamos al usuario por su código de estudiante en Postgres
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.studentCode, credentials.codigo)) // Usa student_code según tu schema
          .limit(1);

        // 2. Si no existe el usuario, rechazamos
        if (!user) return null;

        // 3. Comparamos el NIP ingresado con la contraseña hasheada en la BD
        const isPasswordValid = await bcrypt.compare(
          credentials.nip,
          user.password,
        );

        if (!isPasswordValid) return null;

        // 4. Si todo es correcto, devolvemos el objeto de usuario para la sesión
        return {
          id: user.id.toString(),
          name: user.name,
          username: user.username,
          image: user.imageURL,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error username exists on user
        token.username = user.username;
        token.picture = user.image;
      }
      
      // Refetch user data when session is updated
      if (trigger === "update" && token.id) {
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        
        if (updatedUser) {
          token.name = updatedUser.name;
          token.username = updatedUser.username;
          token.picture = updatedUser.imageURL;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
