import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const store = await cookies();
  if (store.get('authToken')) {
    redirect('/profile');
  }
  return <LoginClient next={typeof next === 'string' ? next : '/profile'} />;
}
