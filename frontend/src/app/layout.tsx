import type { Metadata } from "next";
import { Figtree, Sora } from "next/font/google";
import "./globals.css";
import "../../public/fa/css/all.min.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orvex",
  description: "Redefining game servers from the ground up",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${figtree.variable} ${sora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
