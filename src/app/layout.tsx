import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indoor Cricket",
  description: "Play cricket indoors using your webcam",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
