import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegisterClient from './RegisterClient';

export default async function Page() {
  const store = await cookies();
  if (store.get('authToken')) redirect('/profile');
  return <RegisterClient />;
}
