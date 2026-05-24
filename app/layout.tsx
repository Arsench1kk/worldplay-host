import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorldPlay Host",
  description: "Spin the globe and discover real folk and party games."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
