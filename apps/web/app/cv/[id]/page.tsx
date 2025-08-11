'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import CvDocument from '../../components/CvDocument';
import { getAuthTokenClient } from '../../lib/auth';
import DOMPurify from 'isomorphic-dompurify';

type Company = { name: string };
type Job = {
  id: number;
  title: string;
  url?: string;
  rawText?: string;
  postedAt?: string;
  company?: Company;
};

type Project = { name: string; link?: string; tech?: string; description?: string[] };
type Experience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  description?: string[];
  tech?: string;
};
type Profile = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string;
  projects: Project[];
  experiences: Experience[];
};
type Me = { email: string; name?: string; profile?: Profile };

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// coerce backend values to string[]
const toStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' && v.trim() ? [v] : [];

export default function CvForJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile>({ projects: [], experiences: [] });
  const [pickProj, setPickProj] = useState<boolean[]>([]);
  const [pickExp, setPickExp] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // job
        const jr = await fetch(`${apiBase}/jobs/${id}`, { cache: 'no-store' });
        if (!jr.ok) throw new Error('Job not found');
        const j: Job = await jr.json();
        if (!mounted) return;
        setJob(j);

        // me/profile
        const token = getAuthTokenClient();
        if (token) {
          const mr = await fetch(`${apiBase}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mr.ok) {
            const m: Me = await mr.json();
            if (!mounted) return;
            setMe(m);

            const projects = (m.profile?.projects ?? []).map((p: any) => ({
              ...p,
              description: toStrArray(p?.description),
            }));
            const experiences = (m.profile?.experiences ?? []).map((x: any) => ({
              ...x,
              description: toStrArray(x?.description),
            }));

            const p: Profile = {
              name: m.name || '',
              headline: m.profile?.headline || '',
              summary: m.profile?.summary || '',
              skills: m.profile?.skills || '',
              projects,
              experiences,
            };
            setProfile(p);
            setPickProj(new Array(p.projects.length).fill(true));
            setPickExp(new Array(p.experiences.length).fill(true));
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (Number.isFinite(id)) void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Sanitize HTML for on-page render
  const safeHtml = useMemo(() => {
    return DOMPurify.sanitize(job?.rawText ?? '', { USE_PROFILES: { html: true } });
  }, [job?.rawText]);

  // Plain text for PDF (strip all tags/attrs)
  const textForPdf = useMemo(() => {
    return DOMPurify.sanitize(job?.rawText ?? '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }, [job?.rawText]);

  async function generatePdf() {
    if (!job) return;
    const chosenProjects = profile.projects.filter((_, i) => pickProj[i]);
    const chosenExperiences = profile.experiences.filter((_, i) => pickExp[i]);

    const blob = await pdf(
      <CvDocument
        profile={profile}
        chosenProjects={chosenProjects}
        chosenExperiences={chosenExperiences}
        target={{
          jobTitle: job.title,
          company: job.company?.name,
          jobDescription: textForPdf, // pass text to PDF
        }}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = `${job.title || 'CV'}`.replace(/[^\w\-]+/g, '_');
    a.href = url;
    a.download = `${safeTitle}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT: Job details */}
      <div className="space-y-3">
        <button className="text-sm opacity-70 underline" onClick={() => router.back()}>
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <div className="text-sm text-gray-400">
          {[job.company?.name, job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '']
            .filter(Boolean)
            .join(' • ')}
        </div>
        {job.url && (
          <a className="underline text-sm" href={job.url} target="_blank" rel="noreferrer">
            Open original posting ↗
          </a>
        )}
        <div className="border rounded p-3 h-96 overflow-auto">
          {safeHtml ? (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="text-sm opacity-90">No description available.</p>
          )}
        </div>
      </div>

      {/* RIGHT: pick experiences/projects & generate */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Build CV</h2>
          <button className="px-3 py-2 border rounded" onClick={generatePdf}>
            Generate PDF
          </button>
        </div>

        {!me && (
          <div className="text-sm text-yellow-400">
            Not logged in — you can still generate, but your saved profile won’t load.{' '}
            <a className="underline" href="/login">
              Login
            </a>
          </div>
        )}

        {/* Projects */}
        <section>
          <h3 className="font-semibold mb-2">Projects</h3>
          {profile.projects.length === 0 ? (
            <p className="text-sm text-gray-500">
              No projects. Add some in your <a className="underline" href="/profile">Profile</a>.
            </p>
          ) : (
            <ul className="space-y-2">
              {profile.projects.map((p, i) => (
                <li key={i} className="border rounded p-2 flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!pickProj[i]}
                    onChange={(e) =>
                      setPickProj(prev => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                    }
                  />
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-400">
                      {[p.link, p.tech].filter(Boolean).join(' • ')}
                    </div>
                    {!!(p.description && p.description.length) && (
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        {p.description.map((line, bi) => (
                          <li key={bi}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Experience */}
        <section>
          <h3 className="font-semibold mb-2">Experience</h3>
          {profile.experiences.length === 0 ? (
            <p className="text-sm text-gray-500">
              No experience. Add some in your <a className="underline" href="/profile">Profile</a>.
            </p>
          ) : (
            <ul className="space-y-2">
              {profile.experiences.map((x, i) => (
                <li key={i} className="border rounded p-2 flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!pickExp[i]}
                    onChange={(e) =>
                      setPickExp(prev => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                    }
                  />
                  <div>
                    <div className="font-medium">
                      {x.title} @ {x.company}
                    </div>
                    <div className="text-sm text-gray-400">
                      {[x.start, x.end || 'Present'].filter(Boolean).join(' — ')}
                    </div>
                    {!!(x.description && x.description.length) && (
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        {x.description.map((line, bi) => (
                          <li key={bi}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {x.tech && <div className="text-xs text-gray-400 mt-1">Tech: {x.tech}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
