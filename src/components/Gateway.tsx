"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState, useCallback, useMemo } from "react";

const CONSTANTS = {
  SIGN_IN_TIMEOUT: 30000,
  CALLBACK_URL: "/",
};

interface SignInError {
  error?: string;
  message?: string;
}

function validateSignInError(error: unknown): string {
  if (error && typeof error === "object") {
    const authError = error as SignInError;

    if (authError.error === "OAuthAccountNotLinked") {
      return "This email is already associated with another account";
    }

    if (authError.error === "AccessDenied") {
      return "Access denied. Please try again.";
    }

    return authError.message || "Authentication failed. Please try again.";
  }

  return "Authentication failed. Please try again.";
}

async function handleGoogleSignIn(): Promise<void> {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    CONSTANTS.SIGN_IN_TIMEOUT,
  );

  try {
    const result = await signIn("google", {
      callbackUrl: CONSTANTS.CALLBACK_URL,
      redirect: false,
    });

    clearTimeout(timeoutId);

    if (result?.error) {
      throw new Error(validateSignInError(result));
    }

    // redirect handled by NextAuth
    if (result?.ok && !result.error) {
      window.location.href = CONSTANTS.CALLBACK_URL;
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Sign in request timed out. Please try again.");
      }

      throw error;
    }

    throw new Error("Network error occurred during sign in");
  }
}

const Gateway = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const isDisabled = useMemo(() => isSigningIn, [isSigningIn]);

  const handleSignIn = useCallback(async () => {
    if (isDisabled) return;

    setIsSigningIn(true);

    try {
      await handleGoogleSignIn();
    } catch (error) {
      console.error("Sign in failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSigningIn(false);
    }
  }, [isDisabled]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center text-center">
        <Image
          priority
          unoptimized
          src="/logo.png"
          width={40}
          height={40}
          alt="ChadGPT Logo"
          className="h-20 w-auto"
        />

        <h1 className="mt-6 text-2xl font-semibold text-black">
          Welcome to ChadGPT
        </h1>

        <h2 className="mt-2 text-gray-600">
          Log in with your Google account to continue
        </h2>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isDisabled}
            className="rounded-md bg-[#10A37F] px-6 py-2 text-lg font-semibold text-white transition duration-200 hover:bg-[#10A37F]/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10A37F]"
          >
            Log in
          </button>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isDisabled}
            className="rounded-md bg-[#10A37F] px-6 py-2 text-lg font-semibold text-white transition duration-200 hover:bg-[#10A37F]/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10A37F]"
          >
            Sign up
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 w-full text-center">
        <p className="text-sm font-bold text-gray-700">
          (This app may or may not be notable)
        </p>
      </div>
    </div>
  );
};

export default Gateway;
