import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peta Sekolah - Pulau Jawa",
  description: "Internal tool pemetaan sekolah SMA, SMK, dan MA di Pulau Jawa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
