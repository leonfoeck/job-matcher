'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAuthTokenClient } from '../lib/auth';

type Project = { name: string; link?: string; tech?: string; description?: string[] };
type Experience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  description?: string[]; // <-- array
  tech?: string;
};
type Profile = {
  favoriteCompanies?: string[];
  headline?: string;
  summary?: string;
  skills?: string;
  projects: Project[];
  experiences: Experience[];
};
type Me = {
  id: number;
  email: string;
  name?: string;
  profile?: Profile;
};

const toStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : typeof v === 'string' && v.length ? [v] : [];

export default function ProfilePage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const [me, setMe] = useState<Me | null>(null);
  const [p, setP] = useState<Profile>({ projects: [], experiences: [] });
  const [msg, setMsg] = useState<string | undefined>();

  const load = useCallback(async () => {
    const token = getAuthTokenClient();
    if (!token) return;
    const r = await fetch(`${api}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return;

    const j: Me = await r.json();
    setMe(j);

    const projects = (j.profile?.projects ?? []).map((pr) => ({
      ...pr,
      description: toStrArray((pr as any).description),
    }));
    const experiences = (j.profile?.experiences ?? []).map((ex) => ({
      ...ex,
      description: toStrArray((ex as any).description),
    }));

    setP({
      favoriteCompanies: Array.isArray(j.profile?.favoriteCompanies)
        ? j.profile!.favoriteCompanies
        : [],
      headline: j.profile?.headline ?? '',
      summary: j.profile?.summary ?? '',
      skills: j.profile?.skills ?? '',
      projects,
      experiences,
    });
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setMsg(undefined);
    const token = getAuthTokenClient();
    if (!token) return;
    const r = await fetch(`${api}/users/me/profile`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(p),
    });
    setMsg(r.ok ? 'Saved' : 'Save failed');
    if (r.ok) await load();
  }

  // ---- helpers for projects
  const setProj = (i: number, patch: Partial<Project>) =>
    setP((prev) => ({
      ...prev,
      projects: prev.projects.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
    }));
  const addProj = () =>
    setP((prev) => ({ ...prev, projects: [...prev.projects, { name: '', description: [] }] }));
  const rmProj = (i: number) =>
    setP((prev) => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));

  const addProjBullet = (i: number) =>
    setProj(i, { description: [...(p.projects[i].description ?? []), ''] });
  const setProjBullet = (i: number, bi: number, value: string) =>
    setProj(i, {
      description: (p.projects[i].description ?? []).map((s, idx) => (idx === bi ? value : s)),
    });
  const rmProjBullet = (i: number, bi: number) =>
    setProj(i, {
      description: (p.projects[i].description ?? []).filter((_, idx) => idx !== bi),
    });

  // ---- helpers for experiences
  const setExp = (i: number, patch: Partial<Experience>) =>
    setP((prev) => ({
      ...prev,
      experiences: prev.experiences.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
    }));
  const addExp = () =>
    setP((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { company: '', title: '', description: [] }],
    }));
  const rmExp = (i: number) =>
    setP((prev) => ({ ...prev, experiences: prev.experiences.filter((_, idx) => idx !== i) }));

  const addExpBullet = (i: number) =>
    setExp(i, { description: [...(p.experiences[i].description ?? []), ''] });
  const setExpBullet = (i: number, bi: number, value: string) =>
    setExp(i, {
      description: (p.experiences[i].description ?? []).map((s, idx) => (idx === bi ? value : s)),
    });
  const rmExpBullet = (i: number, bi: number) =>
    setExp(i, {
      description: (p.experiences[i].description ?? []).filter((_, idx) => idx !== bi),
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="text-sm text-gray-400">{me?.email}</div>
      </div>

      <section className="space-y-3">
        <textarea
          className="w-full border rounded p-2 h-24 bg-transparent"
          placeholder="Favorite Companies (One per line)"
          value={(p.favoriteCompanies ?? []).join('\n')}
          onChange={(e) =>
            setP((prev) => ({
              ...prev,
              favoriteCompanies: e.target.value
                .split(/\r?\n/) // Zeilen -> Array
                .map((s) => s.trim())
                .filter(Boolean), // leere Zeilen raus
            }))
          }
        />

        <input
          className="w-full border rounded p-2 bg-transparent"
          placeholder="Headline"
          value={p.headline || ''}
          onChange={(e) => setP({ ...p, headline: e.target.value })}
        />
        <textarea
          className="w-full border rounded p-2 h-24 bg-transparent"
          placeholder="Summary"
          value={p.summary || ''}
          onChange={(e) => setP({ ...p, summary: e.target.value })}
        />
        <input
          className="w-full border rounded p-2 bg-transparent"
          placeholder="Skills (comma-separated)"
          value={p.skills || ''}
          onChange={(e) => setP({ ...p, skills: e.target.value })}
        />
      </section>

      {/* Projects */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Projects</h2>
          <button className="text-sm px-2 py-1 border rounded" onClick={addProj}>
            + Add
          </button>
        </div>

        {p.projects.map((proj, i) => (
          <div key={i} className="border rounded p-3 space-y-3">
            <input
              className="w-full border rounded p-2 bg-transparent"
              placeholder="Project name"
              value={proj.name}
              onChange={(e) => setProj(i, { name: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 bg-transparent"
              placeholder="Link"
              value={proj.link || ''}
              onChange={(e) => setProj(i, { link: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 bg-transparent"
              placeholder="Tech"
              value={proj.tech || ''}
              onChange={(e) => setProj(i, { tech: e.target.value })}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Description bullets</h4>
                <button
                  className="text-sm px-2 py-1 border rounded"
                  onClick={() => addProjBullet(i)}
                >
                  + Add bullet
                </button>
              </div>
              {(proj.description ?? []).map((line, bi) => (
                <div key={bi} className="flex gap-2">
                  <input
                    className="flex-1 border rounded p-2 bg-transparent"
                    placeholder="Bullet point"
                    value={line}
                    onChange={(e) => setProjBullet(i, bi, e.target.value)}
                  />
                  <button
                    className="text-sm px-2 py-1 border rounded"
                    onClick={() => rmProjBullet(i, bi)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(!proj.description || proj.description.length === 0) && (
                <p className="text-xs text-gray-500">No bullets yet.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button className="text-sm px-2 py-1 border rounded" onClick={() => rmProj(i)}>
                Remove project
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Experience */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Experience</h2>
          <button className="text-sm px-2 py-1 border rounded" onClick={addExp}>
            + Add
          </button>
        </div>

        {p.experiences.map((x, i) => (
          <div key={i} className="border rounded p-3 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="border rounded p-2 bg-transparent"
                placeholder="Company"
                value={x.company}
                onChange={(e) => setExp(i, { company: e.target.value })}
              />
              <input
                className="border rounded p-2 bg-transparent"
                placeholder="Title"
                value={x.title}
                onChange={(e) => setExp(i, { title: e.target.value })}
              />
              <input
                className="border rounded p-2 bg-transparent"
                placeholder="Start (YYYY-MM)"
                value={x.start || ''}
                onChange={(e) => setExp(i, { start: e.target.value })}
              />
              <input
                className="border rounded p-2 bg-transparent"
                placeholder="End (YYYY-MM or Present)"
                value={x.end || ''}
                onChange={(e) => setExp(i, { end: e.target.value })}
              />
            </div>

            <input
              className="w-full border rounded p-2 bg-transparent"
              placeholder="Tech"
              value={x.tech || ''}
              onChange={(e) => setExp(i, { tech: e.target.value })}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Description bullets</h4>
                <button
                  className="text-sm px-2 py-1 border rounded"
                  onClick={() => addExpBullet(i)}
                >
                  + Add bullet
                </button>
              </div>
              {(x.description ?? []).map((line, bi) => (
                <div key={bi} className="flex gap-2">
                  <input
                    className="flex-1 border rounded p-2 bg-transparent"
                    placeholder="Bullet point"
                    value={line}
                    onChange={(e) => setExpBullet(i, bi, e.target.value)}
                  />
                  <button
                    className="text-sm px-2 py-1 border rounded"
                    onClick={() => rmExpBullet(i, bi)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(!x.description || x.description.length === 0) && (
                <p className="text-xs text-gray-500">No bullets yet.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button className="text-sm px-2 py-1 border rounded" onClick={() => rmExp(i)}>
                Remove experience
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3">
        <button className="px-3 py-2 border rounded" onClick={save}>
          Save
        </button>
        {msg && <span className="text-sm text-gray-400">{msg}</span>}
      </div>
    </div>
  );
}
