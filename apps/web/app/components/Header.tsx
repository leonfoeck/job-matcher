'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();
  return (
    <header className="border-b border-gray-700 bg-black/40 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold">
          Job Matcher
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/" className={path === '/' ? 'underline' : ''}>
            Jobs
          </Link>
          <Link href="/profile" className={path.startsWith('/profile') ? 'underline' : ''}>
            Profile
          </Link>
          <Link href="/login" className={path === '/login' ? 'underline' : ''}>
            Login
          </Link>
          <Link href="/register" className={path === '/register' ? 'underline' : ''}>
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
