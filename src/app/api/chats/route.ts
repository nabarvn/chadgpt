import { db } from "@/firebase/client";
import { getAuthSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  chatId?: string;
}

interface ChatDocument {
  userId: string;
  createdAt: ReturnType<typeof serverTimestamp>;
}

async function getAuthenticatedUser() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return {
      error: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      ),
      userEmail: null,
    };
  }

  return { error: null, userEmail: session.user.email };
}

export async function POST(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const { error: authError, userEmail } = await getAuthenticatedUser();

    if (authError || !userEmail) {
      return authError!;
    }

    const chatsCollectionRef = collection(db, "users", userEmail, "chats");

    // check for existing empty chat
    const latestChatQuery = query(
      chatsCollectionRef,
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const latestChatSnapshot = await getDocs(latestChatQuery);

    if (!latestChatSnapshot.empty) {
      const lastChatDoc = latestChatSnapshot.docs[0];

      // check if the latest chat has any messages
      const messagesQuery = query(
        collection(lastChatDoc.ref, "messages"),
        limit(1),
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      if (messagesSnapshot.empty) {
        return NextResponse.json(
          {
            success: true,
            chatId: lastChatDoc.id,
            message: "Returning existing empty chat.",
          },
          { status: 200 },
        );
      }
    }

    const newChatData: ChatDocument = {
      userId: userEmail,
      createdAt: serverTimestamp(),
    };

    const newChatDoc = await addDoc(chatsCollectionRef, newChatData);

    return NextResponse.json(
      {
        success: true,
        chatId: newChatDoc.id,
        message: "New chat created.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Chat creation failed:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: "Failed to create chat." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const { error: authError, userEmail } = await getAuthenticatedUser();

    if (authError || !userEmail) {
      return authError!;
    }

    const chatsRef = collection(db, "users", userEmail, "chats");
    const snapshot = await getDocs(chatsRef);

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: true,
          message: "No chats found to delete.",
        },
        { status: 200 },
      );
    }

    // firestore batch limit
    const BATCH_SIZE = 500;

    const docs = snapshot.docs;
    const totalDocs = docs.length;

    // process documents in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + BATCH_SIZE);

      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted ${totalDocs} chats.`,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Bulk chat deletion failed:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: "Failed to delete chats." },
      { status: 500 },
    );
  }
}
