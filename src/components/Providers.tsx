"use client";

import { SWRConfig } from "swr";
import { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { CustomToaster } from "@/components";
import { SessionProvider } from "next-auth/react";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SWRConfig>
      <ThemeProvider enableSystem={true} attribute="class">
        <SessionProvider>
          <CustomToaster />
          {children}
        </SessionProvider>
      </ThemeProvider>
    </SWRConfig>
  );
};

export default Providers;
