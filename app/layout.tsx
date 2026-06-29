import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { UIProvider } from "@/contexts/UIContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anxiety Fightwear — Peralatan Olahraga & Fightwear",
  description:
    "Anxiety Fightwear adalah brand peralatan olahraga beladiri asal Bandung yang berdiri sejak tahun 2014. Seluruh produk diproduksi di pabrik milik kami sendiri sehingga kualitas tetap terjaga dengan harga yang kompetitif.",
  keywords: [
    "Anxiety Fightwear",
    "boxing gloves",
    "hand wrap",
    "rashguard",
    "fight shorts",
    "shin guard",
    "mouth guard",
    "gym bag",
    "apparel olahraga",
    "aksesoris latihan",
    "toko online",
    "UMKM",
  ],
  authors: [{ name: "Anxiety Fightwear" }],
  openGraph: {
    title: "Anxiety Fightwear — Peralatan Olahraga & Fightwear",
    description:
      "Temukan perlengkapan latihan terbaik. Boxing gloves, rashguard, fight shorts, dan banyak lagi.",
    type: "website",
    locale: "id_ID",
    siteName: "Anxiety Fightwear",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anxiety Fightwear",
    description: "Peralatan Olahraga & Fightwear Berkualitas",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.className} antialiased min-h-screen bg-[#0a0a0a] text-white selection:bg-[#dc2626] selection:text-white`}
      >
        <CartProvider>
          <ToastProvider>
            <UIProvider>
              <AppShell>{children}</AppShell>
            </UIProvider>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
