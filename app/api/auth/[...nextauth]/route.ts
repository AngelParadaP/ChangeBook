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

        if (!user.verified) {
          throw new Error("Cuenta no verificada. Revisa tu correo electrónico.");
        }

        if (user.banned) {
          throw new Error("Esta cuenta ha sido baneada permanentemente.");
        }

        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
          const formattedDate = new Date(user.suspendedUntil).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
          throw new Error(`Cuenta suspendida por strikes hasta el ${formattedDate}.`);
        }

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
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Al hacer login por primera vez
      if (user) {
        token.id = user.id;
        // @ts-expect-error username exists on user
        token.username = user.username;
        token.picture = user.image;
        // @ts-expect-error role exists on user
        token.role = user.role;
      }

      // Siempre sincronizar role desde la BD (cubre sesiones existentes y cambios de rol en tiempo real)
      if (token.id && (trigger === "update" || !token.role)) {
        const [dbUser] = await db
          .select({ name: users.name, username: users.username, imageURL: users.imageURL, role: users.role })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (dbUser) {
          token.name = dbUser.name;
          token.username = dbUser.username;
          token.picture = dbUser.imageURL;
          token.role = dbUser.role;
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
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
