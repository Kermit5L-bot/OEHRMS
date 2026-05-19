import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "在线展厅预约管理系统",
  description: "在线展厅预约管理系统项目初始化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
