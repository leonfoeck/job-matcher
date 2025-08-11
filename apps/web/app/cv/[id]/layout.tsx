import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function CvLayout({
  children,
  params,
}: {
  children: ReactNode;
  // In async Dynamic APIs, params is a Promise you must await
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies(); // await required
  const token = cookieStore.get('authToken')?.value;

  if (!token) {
    const next = `/cv/${encodeURIComponent(id)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return <>{children}</>;
}
