import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions, getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token }) {
      if (token.name && !token.username) {
        token.username = token.name.split(" ").join("").toLowerCase();
      }

      if (token.sub) {
        token.id = token.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id;
        }

        if (token.username) {
          session.user.username = token.username;
        }
      }

      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
