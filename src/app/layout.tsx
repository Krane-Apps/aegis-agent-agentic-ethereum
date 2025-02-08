import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NEXT_PUBLIC_URL } from "../config";

import "./global.css";
import "@coinbase/onchainkit/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { Bounce } from "react-toastify";
import { ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ["latin"] });

const OnchainProviders = dynamic(
  () => import("src/components/OnchainProviders"),
  {
    ssr: false,
  }
);

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: "Aegis AI Agent",
  description: "Advanced Smart Contract Security Monitor",
  openGraph: {
    title: "Aegis AI Agent",
    description: "Advanced Smart Contract Security Monitor",
    images: [`${NEXT_PUBLIC_URL}/vibes/vibes-19.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark min-h-screen w-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <OnchainProviders>{children}</OnchainProviders>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            transition={Bounce}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
