// apps/web/app/login/page.tsx
import LoginClient from './LoginClient';

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginClient next={typeof next === 'string' ? next : '/profile'} />;
}
