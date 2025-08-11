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
  rawText?: string; // HTML (UI: sanitized render, PDF: plaintext)
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

// Coerce backend values to string[]
const toStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' && v.trim() ? [v] : [];

// ——————————————————————————————————————
// YouTube-Embedding: nur YT whitelisten
// ——————————————————————————————————————
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
      const v = u.searchParams.get('v');
      if (v) return v;
    }
  } catch {}
  return null;
}

function preProcessIframes(raw: string): string {
  // Ersetze alle iframes: nur YouTube bleibt als Embed, Rest wird Link
  return raw.replace(/<iframe[\s\S]*?<\/iframe>/gi, (match) => {
    const srcMatch = match.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
    const src = srcMatch?.[1] || '';
    const id = extractYouTubeId(src);
    if (!id) {
      // Unbekannte Embeds -> sicherer Link
      return `<p><a href="${src}" rel="noopener noreferrer" target="_blank">Open embedded content ↗</a></p>`;
    }
    const safeSrc = `https://www.youtube-nocookie.com/embed/${id}`;
    return `
      <div class="my-4 aspect-video">
        <iframe
          src="${safeSrc}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          title="YouTube video"
        ></iframe>
      </div>`;
  });
}

// ——————————————————————————————————————
// Page
// ——————————————————————————————————————
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
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    let mounted = true;

    async function load() {
      try {
        // Job
        const jr = await fetch(`${apiBase}/jobs/${id}`, {
          cache: 'no-store',
          signal: ac.signal,
        });
        if (!jr.ok) throw new Error('Job not found');
        const j: Job = await jr.json();
        if (!mounted) return;
        setJob(j);

        // Me/Profile (nur falls Token da)
        const token = getAuthTokenClient();
        if (token) {
          const mr = await fetch(`${apiBase}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: ac.signal,
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

    void load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [id]);

  // ——— Sanitizing für UI ———
  const allowedTags = useMemo(
    () => [
      'h1','h2','h3','h4','p','br','strong','em','u',
      'ul','ol','li','a','blockquote','code','pre','hr',
      'table','thead','tbody','tr','th','td','colgroup','col',
      'span','div','iframe'
    ],
    [],
  );
  const allowedAttrs = useMemo(
    () => ['href','title','target','rel','src','loading','allow','allowfullscreen','sandbox'],
    [],
  );

  const safeHtml = useMemo(() => {
    const html = job?.rawText ?? '';
    const withEmbeds = preProcessIframes(html);
    return DOMPurify.sanitize(withEmbeds, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttrs,
      FORBID_TAGS: ['style','script'],
      FORBID_ATTR: ['style','onerror','onclick','onload'],
      ALLOW_DATA_ATTR: false,
    });
  }, [job?.rawText, allowedTags, allowedAttrs]);

  // Plaintext für PDF
  const textForPdf = useMemo(() => {
    const html = job?.rawText ?? '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }, [job?.rawText]);

  // Links absichern
  useEffect(() => {
    const root = document.getElementById('job-html');
    if (!root) return;
    root.querySelectorAll('a').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }, [safeHtml]);

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
          jobDescription: textForPdf,
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
  if (!Number.isFinite(id)) return <div className="p-6">Invalid job id</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6 p-0">
      {/* LEFT: Job details */}
      <div className="space-y-4">
        <button
          className="text-sm opacity-70 underline"
          onClick={() => router.back()}
        >
          &larr; Back
        </button>

        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          {job.title}
        </h1>

        <div className="text-sm text-gray-400">
          {[job.company?.name, job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '']
            .filter(Boolean)
            .join(' • ')}
        </div>

        {job.url && (
          <a
            className="underline text-sm"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            Open original posting ↗
          </a>
        )}

        {/* Lesbarer HTML-Block (scrollable) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 max-h-[70vh] overflow-auto">
          {safeHtml ? (
            <article
              id="job-html"
              className="
                prose prose-invert prose-lg md:prose-xl max-w-none
                prose-headings:font-semibold
                prose-h2:mt-6 prose-h3:mt-4 prose-p:leading-relaxed
                prose-ul:my-2 prose-ol:my-2
                prose-li:marker:opacity-70
                prose-a:underline
                prose-table:table-auto prose-th:font-semibold
                [&_iframe]:w-full [&_iframe]:h-full
              "
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
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
                    checked={pickExp[i]}
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
