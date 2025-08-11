import Link from 'next/link';
import { cookies } from 'next/headers';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const store = await cookies();
  const token = store.get('authToken')?.value;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-700 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold">
          Job Matcher
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/">Jobs</Link>
          {token ? (
            <>
              <Link href="/profile">Profile</Link>
              <LogoutButton />
            </>
          ) : (
            // only Login when logged out
            <Link href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
