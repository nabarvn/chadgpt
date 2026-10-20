"use client";

import { SWRConfig } from "swr";
import { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { ChatTitleProvider } from "@/hooks";
import { CustomToaster } from "@/components";
import { SessionProvider } from "next-auth/react";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SWRConfig>
      <ThemeProvider enableSystem={true} attribute="class">
        <SessionProvider>
          <ChatTitleProvider>
            <CustomToaster />
            {children}
          </ChatTitleProvider>
        </SessionProvider>
      </ThemeProvider>
    </SWRConfig>
  );
};

export default Providers;
