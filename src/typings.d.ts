import { Timestamp } from "firebase/firestore";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

import type {
  Session as NextAuthSession,
  User as NextAuthUser,
} from "next-auth";

export interface UserProfile {
  _id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id?: string;
  text: string;
  createdAt: Timestamp | string | Date;
  user: UserProfile;
}

export type SerializedMessage = Omit<Message, "createdAt"> & {
  id: string;
  createdAt: string;
};

export interface GPTMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatSession {
  id: string;
  createdAt: Timestamp | string;
  messages?: Message[];
}

export interface ChatState {
  isInitialized: boolean;
  isCreating: boolean;
  initialPromptSent: boolean;
  optimisticMessage: MessageType | null;
  isSendingMessage: boolean;
  streamingMessage: MessageType | null;
  isAtBottom: boolean;
}

export interface FirebaseDoc<T> {
  id: string;
  data: () => T;
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id?: string | null;
    username?: string | null;
  }
}

declare module "next-auth" {
  interface User extends NextAuthUser {
    id?: string | null;
    username?: string | null;
  }

  interface Session extends NextAuthSession {
    user?: User;
  }
}
