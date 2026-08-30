import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "./client-layout";

const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.woff2", weight: "400" },
    { path: "../public/fonts/Inter-Medium.woff2", weight: "500" },
    { path: "../public/fonts/Inter-SemiBold.woff2", weight: "600" },
    { path: "../public/fonts/Inter-Bold.woff2", weight: "700" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = localFont({
  src: [
    { path: "../public/fonts/JetBrainsMono-Regular.woff2", weight: "400" },
    { path: "../public/fonts/JetBrainsMono-Medium.woff2", weight: "500" },
    { path: "../public/fonts/JetBrainsMono-Bold.woff2", weight: "700" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const sourceSerif = localFont({
  src: [
    { path: "../public/fonts/SourceSerif4-Regular.woff2", weight: "400" },
    { path: "../public/fonts/SourceSerif4-Semibold.woff2", weight: "600" },
  ],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ccsert.dev｜全栈开发、DevOps 与 AI 工程",
  description: "ccsert 的个人主页：全栈开发、DevOps、云原生与 AI Agent 工程实践。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${jetBrainsMono.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full scanlines grain">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
