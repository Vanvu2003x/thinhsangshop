import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Shop Thịnh Sáng | Cổng Nạp Game Tự Động Uy Tín 24/7",
    template: "%s | Shop Thịnh Sáng"
  },
  description: "Shop Thịnh Sáng - Hệ thống nạp game UID tự động giá rẻ, uy tín, an toàn và nhanh chóng hàng đầu Việt Nam. Hỗ trợ nạp game Mobile Legends: Bang Bang, Honor of Kings, Genshin Impact, Star Rail 24/7.",
  keywords: [
    "shop thịnh sáng", 
    "thinhsangshop", 
    "nạp game", 
    "nạp game giá rẻ", 
    "nạp mlbb", 
    "nạp honor of kings", 
    "nạp game tự động", 
    "thinhsangshop.io.vn", 
    "nạp game uid", 
    "nạp kim cương mlbb"
  ],
  authors: [{ name: "Shop Thịnh Sáng" }],
  metadataBase: new URL("https://thinhsangshop.io.vn"),
  alternates: {
    canonical: "https://thinhsangshop.io.vn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Shop Thịnh Sáng | Cổng Nạp Game Tự Động Uy Tín 24/7",
    description: "Hệ thống nạp game tự động uy tín, giá rẻ nhất thị trường. Xử lý đơn hàng nhanh chóng, bảo mật và an toàn 24/7.",
    url: "https://thinhsangshop.io.vn",
    siteName: "Shop Thịnh Sáng",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 500,
        height: 500,
        alt: "Shop Thịnh Sáng Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Thịnh Sáng | Cổng Nạp Game Tự Động Uy Tín 24/7",
    description: "Nạp game UID tự động giá rẻ, uy tín, an toàn 24/7. Xử lý ngay lập tức.",
    images: ["/logo.jpg"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
