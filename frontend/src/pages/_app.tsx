import type { AppProps } from "next/app";
import "@/styles/globals.css";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthProvider from "@/contexts/auth-context";
import SetupChecker from "@/components/setup/SetupChecker";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AutomationLoader from "@/components/automation/AutomationLoader";
import ChatProvider from "@/contexts/chat-context";
import ChatPanel from "@/components/chat/ChatPanel";
import { Notifications } from "@/components/Notifications";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeProvider defaultTheme="system" enableSystem>
        <AuthProvider>
          <SetupChecker>
            <ChatProvider>
              <ProtectedRoute>
                <Component {...pageProps} />
              </ProtectedRoute>
              <ChatPanel />
            </ChatProvider>
          </SetupChecker>
        </AuthProvider>
        <AutomationLoader
          showDevPanel={process.env.NODE_ENV === "development"}
          enableConsoleAccess={true}
        />
        <Notifications />
      </ThemeProvider>
    </NextThemesProvider>
  );
}
