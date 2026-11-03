import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asian Furniture — Made in Bangladesh, since 2010",
  description:
    "Furniture for how Bangladeshi homes actually live. Visit a showroom or explore the collection online. Founded in Dhaka in 2010.",
  metadataBase: new URL("https://asianfurniture.com.bd"),
  openGraph: {
    title: "Asian Furniture",
    description: "Made in Bangladesh, since 2010.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}