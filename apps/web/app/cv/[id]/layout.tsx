import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CvLayout(
    { children, params }: { children: React.ReactNode; params: { id: string } }
) {
    const store = await cookies();                   // <-- await!
    const token = store.get('authToken')?.value;

    if (!token) {
        const next = `/cv/${encodeURIComponent(params.id)}`;
        redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    return <>{children}</>;
}
