'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name,setName]=useState('');
    const [error, setError] = useState<string|undefined>(); const router = useRouter();

    async function submit(e: React.FormEvent) {
        e.preventDefault(); setError(undefined);
        try {
            const r = await fetch(`${api}/auth/register`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email, password, name }) });
            const json = await r.json();
            if (!r.ok) throw new Error(json?.message || 'Register failed');
            document.cookie = `authToken=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;
            router.push('/profile');
        } catch (e:any) { setError(e.message); }
    }

    return (
        <div className="max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold">Register</h1>
            <form onSubmit={submit} className="space-y-3">
                <input className="w-full border rounded p-2 bg-transparent" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
                <input className="w-full border rounded p-2 bg-transparent" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                <input className="w-full border rounded p-2 bg-transparent" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
                <button className="px-3 py-2 border rounded">Create account</button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </form>
            <p className="text-sm">Have an account? <a className="underline" href="/login">Login</a></p>
        </div>
    );
}
