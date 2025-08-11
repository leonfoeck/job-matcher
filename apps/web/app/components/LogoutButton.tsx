'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="px-3 py-2 border rounded"
      onClick={() => {
        // remove auth cookie
        document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
        router.push('/');
        router.refresh(); // re-render server header with no token
      }}
    >
      Logout
    </button>
  );
}
