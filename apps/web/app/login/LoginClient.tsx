'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginClient({ next }: { next: string }) {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      const r = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.message || 'Login failed');

      document.cookie = [
        `authToken=${json.accessToken}`, // no encodeURIComponent
        'Path=/',
        'SameSite=Lax',
        'Max-Age=2592000', // 30 days
      ].join('; ');

      router.push(next || '/profile');
      router.refresh(); // make server header reflect new auth
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border rounded p-2 bg-transparent"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 bg-transparent"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="px-3 py-2 border rounded">Login</button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
      <p className="text-sm">
        No account?{' '}
        <a className="underline" href="/register">
          Register
        </a>
      </p>
    </div>
  );
}
