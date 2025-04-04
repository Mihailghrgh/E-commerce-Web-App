import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Container from "@/components/global/Container";
import Navbar from "@/components/navbar/Navbar";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   display: "swap",
// });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next JS Store Project",
  description: "An E-commerce store made with NextJS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  const { data } = await axios.get(
    `http://localhost:3000/api/products?type=isAdmin&userId=${userId === null ? 'no_user_id': userId}`
  );

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers>
            <Navbar isAdmin={data} />
            <Container className="py-20">{children}</Container>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
