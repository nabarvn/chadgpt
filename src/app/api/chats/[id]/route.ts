import { db } from "@/firebase/client";
import { getAuthSession } from "@/lib/auth";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface DeleteRouteParams {
  params: { id: string };
}

export async function DELETE(
  _req: NextRequest,
  { params }: DeleteRouteParams,
): Promise<NextResponse<ApiResponse>> {
  const session = await getAuthSession();

  try {
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const chatId = params?.id?.trim();

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: "Valid chat ID is required." },
        { status: 400 },
      );
    }

    const userEmail = session.user.email;

    // verify chat ownership before deletion
    const chatDocRef = doc(db, "users", userEmail, "chats", chatId);
    const chatDoc = await getDoc(chatDocRef);

    if (!chatDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Chat not found or access denied." },
        { status: 404 },
      );
    }

    await deleteDoc(chatDocRef);

    return NextResponse.json(
      { success: true, message: "Chat deleted." },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Chat deletion failed:", {
      error: errorMessage,
      chatId: params?.id,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: "Failed to delete chat." },
      { status: 500 },
    );
  }
}
