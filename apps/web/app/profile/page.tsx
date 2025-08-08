'use client';
import { useEffect, useState } from 'react';
import { getAuthTokenClient } from '../lib/auth';

type Project = { name: string; link?: string; tech?: string; description?: string };
type Experience = { company: string; title: string; start?: string; end?: string; description?: string; tech?: string };
type Profile = { headline?: string; summary?: string; skills?: string; projects: Project[]; experiences: Experience[] };
type Me = { id:number; email:string; name?:string; profile?: { headline?:string; summary?:string; skills?:string; projects:Project[]; experiences:Experience[] } };

export default function ProfilePage() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const [me, setMe] = useState<Me | null>(null);
    const [p, setP] = useState<Profile>({ projects:[], experiences:[] });
    const [msg, setMsg] = useState<string|undefined>();

    async function load() {
        const token = getAuthTokenClient(); if (!token) return;
        const r = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
        if (r.ok) {
            const j = await r.json(); setMe(j);
            setP({
                headline: j.profile?.headline ?? '',
                summary: j.profile?.summary ?? '',
                skills: j.profile?.skills ?? '',
                projects: j.profile?.projects ?? [],
                experiences: j.profile?.experiences ?? [],
            });
        }
    }
    useEffect(() => { load(); }, []);

    async function save() {
        setMsg(undefined);
        const token = getAuthTokenClient(); if (!token) return;
        const r = await fetch(`${api}/users/me/profile`, {
            method:'PUT',
            headers: { 'content-type':'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(p)
        });
        if (r.ok) { setMsg('Saved'); await load(); } else { setMsg('Save failed'); }
    }

    const setProj = (i:number, patch:Partial<Project>) =>
        setP(prev => ({ ...prev, projects: prev.projects.map((x,idx)=> idx===i ? {...x, ...patch} : x) }));
    const addProj = () => setP(prev => ({ ...prev, projects: [...prev.projects, { name:'' }] }));
    const rmProj = (i:number) => setP(prev => ({ ...prev, projects: prev.projects.filter((_,idx)=> idx!==i) }));
    const setExp = (i:number, patch:Partial<Experience>) =>
        setP(prev => ({ ...prev, experiences: prev.experiences.map((x,idx)=> idx===i ? {...x, ...patch} : x) }));
    const addExp = () => setP(prev => ({ ...prev, experiences: [...prev.experiences, { company:'', title:'' }] }));
    const rmExp = (i:number) => setP(prev => ({ ...prev, experiences: prev.experiences.filter((_,idx)=> idx!==i) }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Profile</h1>
                <div className="text-sm text-gray-400">{me?.email}</div>
            </div>

            <section className="space-y-3">
                <input className="w-full border rounded p-2 bg-transparent" placeholder="Headline" value={p.headline || ''} onChange={e=>setP({...p, headline:e.target.value})} />
                <textarea className="w-full border rounded p-2 h-24 bg-transparent" placeholder="Summary" value={p.summary || ''} onChange={e=>setP({...p, summary:e.target.value})} />
                <input className="w-full border rounded p-2 bg-transparent" placeholder="Skills (comma-separated)" value={p.skills || ''} onChange={e=>setP({...p, skills:e.target.value})} />
            </section>

            <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Projects</h2>
                    <button className="text-sm px-2 py-1 border rounded" onClick={addProj}>+ Add</button>
                </div>
                {p.projects.map((proj,i)=>(
                    <div key={i} className="border rounded p-3 space-y-2">
                        <input className="w-full border rounded p-2 bg-transparent" placeholder="Project name" value={proj.name} onChange={e=>setProj(i,{name:e.target.value})} />
                        <input className="w-full border rounded p-2 bg-transparent" placeholder="Link" value={proj.link||''} onChange={e=>setProj(i,{link:e.target.value})} />
                        <input className="w-full border rounded p-2 bg-transparent" placeholder="Tech" value={proj.tech||''} onChange={e=>setProj(i,{tech:e.target.value})} />
                        <textarea className="w-full border rounded p-2 bg-transparent" placeholder="Description" value={proj.description||''} onChange={e=>setProj(i,{description:e.target.value})} />
                        <div className="flex justify-end"><button className="text-sm px-2 py-1 border rounded" onClick={()=>rmProj(i)}>Remove</button></div>
                    </div>
                ))}
            </section>

            <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Experience</h2>
                    <button className="text-sm px-2 py-1 border rounded" onClick={addExp}>+ Add</button>
                </div>
                {p.experiences.map((x,i)=>(
                    <div key={i} className="border rounded p-3 space-y-2">
                        <div className="grid gap-3 md:grid-cols-2">
                            <input className="border rounded p-2 bg-transparent" placeholder="Company" value={x.company} onChange={e=>setExp(i,{company:e.target.value})}/>
                            <input className="border rounded p-2 bg-transparent" placeholder="Title" value={x.title} onChange={e=>setExp(i,{title:e.target.value})}/>
                            <input className="border rounded p-2 bg-transparent" placeholder="Start (YYYY-MM)" value={x.start||''} onChange={e=>setExp(i,{start:e.target.value})}/>
                            <input className="border rounded p-2 bg-transparent" placeholder="End (YYYY-MM or Present)" value={x.end||''} onChange={e=>setExp(i,{end:e.target.value})}/>
                        </div>
                        <input className="w-full border rounded p-2 bg-transparent" placeholder="Tech" value={x.tech||''} onChange={e=>setExp(i,{tech:e.target.value})}/>
                        <textarea className="w-full border rounded p-2 bg-transparent" placeholder="What you did" value={x.description||''} onChange={e=>setExp(i,{description:e.target.value})}/>
                        <div className="flex justify-end"><button className="text-sm px-2 py-1 border rounded" onClick={()=>rmExp(i)}>Remove</button></div>
                    </div>
                ))}
            </section>

            <div className="flex items-center gap-3">
                <button className="px-3 py-2 border rounded" onClick={save}>Save</button>
                {msg && <span className="text-sm text-gray-400">{msg}</span>}
                <button className="px-3 py-2 border rounded" onClick={() => { document.cookie = 'authToken=; Max-Age=0; Path=/'; location.href = '/'; }}>Logout</button>
            </div>
        </div>
    );
}
