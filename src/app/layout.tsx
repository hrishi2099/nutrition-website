import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriSap - Your Nutrition Partner",
  description: "Transform your health with personalized nutrition plans and expert guidance from NutriSap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ErrorBoundaryWrapper>
          <AuthProvider>
            <ErrorBoundaryWrapper name="Header">
              <Header />
            </ErrorBoundaryWrapper>
            <main className="pt-16 min-h-screen bg-white dark:bg-gray-900">
              <ErrorBoundaryWrapper name="Page Content">
                {children}
              </ErrorBoundaryWrapper>
            </main>
            <ErrorBoundaryWrapper name="Footer">
              <Footer />
            </ErrorBoundaryWrapper>
            <ErrorBoundaryWrapper name="Chatbot">
              <Chatbot />
            </ErrorBoundaryWrapper>
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
