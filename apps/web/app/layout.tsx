import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Job Matcher',
  description: 'Generate your CV based on your job applications',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <body
      id="top"
      className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-black text-white flex flex-col`}
    >
    <Header />
    <main className="max-w-5xl mx-auto p-6 flex-1">{children}</main>
    <Footer />
    </body>
    </html>
  );
}

