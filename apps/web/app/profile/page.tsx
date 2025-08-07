'use client';

import { useEffect, useMemo, useState } from 'react';

type Project = { name: string; link?: string; tech?: string; description?: string };
type Experience = { company: string; title: string; start?: string; end?: string; description?: string; tech?: string };
type Profile = {
    name: string;
    headline?: string;
    summary?: string;
    skills?: string;       // comma-separated
    projects: Project[];
    experience: Experience[];
};

const STORAGE_KEY = 'jm.profile.v1';
const empty: Profile = { name: '', headline: '', summary: '', skills: '', projects: [], experience: [] };

export default function ProfilePage() {
    const [p, setP] = useState<Profile>(empty);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    // load once
    useEffect(() => {
        try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setP(JSON.parse(raw)); } catch {}
    }, []);

    // autosave (debounced)
    useEffect(() => {
        const id = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
            setSavedAt(new Date().toLocaleTimeString());
        }, 400);
        return () => clearTimeout(id);
    }, [p]);

    const skillTags = useMemo(
        () => (p.skills || '').split(',').map(s => s.trim()).filter(Boolean),
        [p.skills]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Your profile</h1>
                <div className="text-xs text-gray-400">{savedAt ? `Saved ${savedAt}` : null}</div>
            </div>

            {/* Basics */}
            <section className="space-y-3">
                <input className="w-full bg-transparent border rounded p-2" placeholder="Name"
                       value={p.name} onChange={e => setP({ ...p, name: e.target.value })} />
                <input className="w-full bg-transparent border rounded p-2" placeholder="Headline (current role)"
                       value={p.headline || ''} onChange={e => setP({ ...p, headline: e.target.value })} />
                <textarea className="w-full bg-transparent border rounded p-2 h-24" placeholder="Summary"
                          value={p.summary || ''} onChange={e => setP({ ...p, summary: e.target.value })} />
                <input className="w-full bg-transparent border rounded p-2" placeholder="Skills (comma-separated)"
                       value={p.skills || ''} onChange={e => setP({ ...p, skills: e.target.value })} />
                {skillTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {skillTags.map(s => <span key={s} className="text-xs px-2 py-1 rounded border border-gray-700">{s}</span>)}
                    </div>
                )}
            </section>

            {/* Projects */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Projects</h2>
                    <button type="button" onClick={() => setP({ ...p, projects: [...p.projects, { name: '' }] })}
                            className="text-sm px-2 py-1 border rounded">+ Add project</button>
                </div>
                <div className="space-y-3">
                    {p.projects.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
                    {p.projects.map((proj, i) => (
                        <div key={i} className="border rounded p-3 space-y-2">
                            <input className="w-full bg-transparent border rounded p-2" placeholder="Project name"
                                   value={proj.name} onChange={e => setProject(i, { name: e.target.value })} />
                            <input className="w-full bg-transparent border rounded p-2" placeholder="Link"
                                   value={proj.link || ''} onChange={e => setProject(i, { link: e.target.value })} />
                            <input className="w-full bg-transparent border rounded p-2" placeholder="Technologies (comma-separated)"
                                   value={proj.tech || ''} onChange={e => setProject(i, { tech: e.target.value })} />
                            <textarea className="w-full bg-transparent border rounded p-2" placeholder="Short description"
                                      value={proj.description || ''} onChange={e => setProject(i, { description: e.target.value })} />
                            <div className="flex justify-end">
                                <button type="button" onClick={() => removeProject(i)} className="text-sm px-2 py-1 border rounded">Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Experience */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Experience</h2>
                    <button type="button" onClick={() => setP({ ...p, experience: [...p.experience, { company: '', title: '' }] })}
                            className="text-sm px-2 py-1 border rounded">+ Add role</button>
                </div>
                <div className="space-y-3">
                    {p.experience.length === 0 && <p className="text-sm text-gray-400">No experience yet.</p>}
                    {p.experience.map((x, i) => (
                        <div key={i} className="border rounded p-3 space-y-2">
                            <div className="grid gap-3 md:grid-cols-2">
                                <input className="bg-transparent border rounded p-2" placeholder="Company"
                                       value={x.company} onChange={e => setExp(i, { company: e.target.value })} />
                                <input className="bg-transparent border rounded p-2" placeholder="Title"
                                       value={x.title} onChange={e => setExp(i, { title: e.target.value })} />
                                <input className="bg-transparent border rounded p-2" placeholder="Start (YYYY-MM)"
                                       value={x.start || ''} onChange={e => setExp(i, { start: e.target.value })} />
                                <input className="bg-transparent border rounded p-2" placeholder="End (YYYY-MM or Present)"
                                       value={x.end || ''} onChange={e => setExp(i, { end: e.target.value })} />
                            </div>
                            <input className="w-full bg-transparent border rounded p-2" placeholder="Technologies (comma-separated)"
                                   value={x.tech || ''} onChange={e => setExp(i, { tech: e.target.value })} />
                            <textarea className="w-full bg-transparent border rounded p-2" placeholder="What you did / achievements"
                                      value={x.description || ''} onChange={e => setExp(i, { description: e.target.value })} />
                            <div className="flex justify-end">
                                <button type="button" onClick={() => removeExp(i)} className="text-sm px-2 py-1 border rounded">Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    function setProject(i: number, patch: Partial<Project>) {
        setP(prev => ({ ...prev, projects: prev.projects.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
    }
    function removeProject(i: number) {
        setP(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));
    }
    function setExp(i: number, patch: Partial<Experience>) {
        setP(prev => ({ ...prev, experience: prev.experience.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
    }
    function removeExp(i: number) {
        setP(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
    }
}
