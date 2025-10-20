import { Metadata } from "next";
import { Session, User } from "next-auth";
import { QuerySnapshot } from "firebase/firestore";

export function constructMetadata({
  title = "ChadGPT - Your AI with a Personality",
  description = "Experience a smarter, sassier conversation with an AI built to deliver confident answers in real-time.",
  image = "/thumbnail.png",
  icons = [
    {
      rel: "icon",
      url: "/favicon.ico", // for standard browsers
    },
    {
      rel: "apple-touch-icon",
      url: "/logo.png", // for Apple devices
    },
  ],
  noIndex = false, // allow search engine bots to crawl and index the website
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: Metadata["icons"];
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@nabarvn",
    },
    icons,
    metadataBase: new URL("https://gpt.nabarun.app"),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export function createUserAvatar(user: User): string {
  if (user.image) return user.image;

  if (user.name)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;

  return `https://ui-avatars.com/api/?name=User`;
}

export function validateSession(session: Session | null): {
  email: string;
  name: string;
  avatar: string;
} {
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  return {
    email: session.user.email,
    name: session.user.name || "User",
    avatar: createUserAvatar(session.user),
  };
}

export interface SessionValidation {
  isValid: boolean;
  userEmail?: string;
  userImage?: string;
  userName?: string;
}

export function validateAndTransformSession(
  session: Session | null,
): SessionValidation {
  if (!session?.user?.email) {
    return { isValid: false };
  }

  return {
    isValid: true,
    userEmail: session.user.email,
    userImage: session.user.image ?? undefined,
    userName: session.user.name ?? undefined,
  };
}

export function validateChatsData(
  chatsSnapshot: QuerySnapshot | undefined,
): boolean {
  return Boolean(chatsSnapshot?.docs && Array.isArray(chatsSnapshot.docs));
}
