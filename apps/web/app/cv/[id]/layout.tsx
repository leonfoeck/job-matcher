import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CvLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>; // <- Promise!
}) {
  const { id } = await params; // <- awaiten
  const store = await cookies(); // async cookies()
  const token = store.get('authToken')?.value;

  if (!token) {
    const next = `/cv/${encodeURIComponent(id)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return <>{children}</>;
}
