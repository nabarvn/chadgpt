import "./globals.css";
import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { constructMetadata } from "@/lib/utils";
import { Providers, Sidebar, Gateway, SlideOver } from "@/components";

export const metadata: Metadata = constructMetadata();

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getAuthSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {session ? (
            <div className="flex">
              <Sidebar />
              <SlideOver />

              <div className="flex-1 bg-white dark:bg-[#343541]">
                {children}
              </div>
            </div>
          ) : (
            <Gateway />
          )}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
