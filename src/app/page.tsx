// src/app/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { userProfile, experiences, projects } from '@/data/portfolio';
import { Experience, Project } from '@/types';
import { fadeIn, staggerContainer } from '@/utils/animations';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
] as const;

/* ---------------------------------------------------------------------- */
/*  Accent system                                                         */
/*  Each experience, project and stack chip owns one accent, chosen by     */
/*  its position in the source data so colours stay put while filtering.   */
/*  (Classes are written out in full so Tailwind can see them.)            */
/* ---------------------------------------------------------------------- */

const ACCENTS = ['purple', 'pink', 'cyan', 'yellow'] as const;
type Accent = (typeof ACCENTS)[number];

const ACCENT: Record<Accent, { dot: string; tint: string }> = {
  purple: { dot: 'bg-purple', tint: 'bg-purple/20' },
  pink: { dot: 'bg-pink', tint: 'bg-pink/25' },
  cyan: { dot: 'bg-cyan', tint: 'bg-cyan/25' },
  yellow: { dot: 'bg-yellow', tint: 'bg-yellow/40' },
};

const accentAt = (i: number): Accent => ACCENTS[Math.max(i, 0) % ACCENTS.length];

/* ---------------------------------------------------------------------- */
/*  Gradient mesh backdrop — slow-drifting blurred blobs                  */
/* ---------------------------------------------------------------------- */

function GradientMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="mesh-blob animate-drift-a h-[52vw] w-[52vw] bg-purple/20"
        style={{ top: '-14%', left: '-12%' }}
      />
      <div
        className="mesh-blob animate-drift-b h-[42vw] w-[42vw] bg-yellow/38"
        style={{ top: '-8%', right: '-10%' }}
      />
      <div
        className="mesh-blob animate-drift-c h-[44vw] w-[44vw] bg-pink/22"
        style={{ top: '38%', right: '-14%' }}
      />
      <div
        className="mesh-blob animate-drift-d h-[40vw] w-[40vw] bg-cyan/22"
        style={{ bottom: '-12%', left: '4%' }}
      />
      <div className="grain-overlay absolute inset-0" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Top scroll-progress bar                                               */
/* ---------------------------------------------------------------------- */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.2 });
  return (
    <motion.div
      className="fixed left-0 top-0 z-50 h-[3px] w-full origin-left bg-gradient-to-r from-purple via-pink via-60% to-yellow"
      style={{ scaleX }}
    />
  );
}

/* ---------------------------------------------------------------------- */
/*  Floating glass nav with a sliding indicator                           */
/* ---------------------------------------------------------------------- */

function FloatingNav({ active }: { active: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="fixed left-1/2 top-5 z-50 hidden -translate-x-1/2 sm:block" aria-label="Sections">
      <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              aria-current={isActive ? 'true' : undefined}
              className="relative rounded-full px-4 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
            >
              {isActive && (
                <motion.span
                  layoutId="navIndicator"
                  className="absolute inset-0 rounded-full bg-ink shadow-[0_8px_20px_-8px_rgba(38,25,63,0.6)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------------- */
/*  Magnetic wrapper — pulls its child gently toward the cursor           */
/* ---------------------------------------------------------------------- */

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });
  const reduceMotion = useReducedMotion();

  const handleMove = (e: React.MouseEvent) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.35);
    y.set(relY * 0.35);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Spotlight glass panel — radial glow tracks the cursor inside it       */
/* ---------------------------------------------------------------------- */

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  return { ref, handleMove };
}

/* ---------------------------------------------------------------------- */
/*  Hero orbs — crisp colour behind a frosted pane, so the glass has       */
/*  something real to blur. Decorative only; hidden below xl.              */
/* ---------------------------------------------------------------------- */

function HeroOrbs({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-36 top-[16%] hidden h-[440px] w-[440px] xl:block"
    >
      <div className="orb-pink animate-float-a absolute h-56 w-56" style={{ left: 96, top: 0 }} />
      <div className="tile-purple animate-float-b absolute h-36 w-56" style={{ left: 0, bottom: 36 }} />
      <div className="tile-cyan animate-float-c absolute h-32 w-32 rotate-12" style={{ right: 0, top: 64 }} />
      <div className="orb-yellow animate-float-b absolute h-28 w-28" style={{ right: 26, bottom: 64 }} />

      <div className="glass absolute left-1/2 top-1/2 h-[300px] w-[232px] -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[2rem]">
        <span className="absolute bottom-4 left-6 font-display text-6xl font-semibold tracking-tight text-ink">
          {initials}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Project card — bento sizing driven by the `featured` flag             */
/* ---------------------------------------------------------------------- */

function ProjectCard({ project, accent }: { project: Project; accent: Accent }) {
  const { ref, handleMove } = useSpotlight();

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      style={{ '--accent': `var(--${accent})` } as React.CSSProperties}
      className={`glass group relative overflow-hidden rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1 ${
        project.featured ? 'md:col-span-2' : ''
      }`}
    >
      {/* Card's own accent colour: a soft corner glow + a cursor spotlight */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl ${ACCENT[accent].dot}`}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(520px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) 26%, transparent), transparent 60%)',
        }}
      />
      <div className="relative">
        <h3 className="mb-3 font-display text-2xl font-semibold tracking-tight text-ink">
          {project.title}
        </h3>
        <p className="mb-6 max-w-lg leading-relaxed text-ink-dim">{project.description}</p>

        <div className="mb-5 flex flex-wrap gap-2">
          {project.technologies.map((tech, i) => (
            <span key={i} className="chip rounded-full px-3 py-1 text-xs font-medium text-ink-dim">
              {tech}
            </span>
          ))}
        </div>

        {(project.liveUrl || project.githubUrl) && (
          <div className="flex gap-5 border-t border-ink/10 pt-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-ink-dim transition-colors hover:text-purple-deep"
              >
                Live site
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-ink-dim transition-colors hover:text-purple-deep"
              >
                Source
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Active-section tracking for the floating nav                          */
/* ---------------------------------------------------------------------- */

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  return active;
}

/* ---------------------------------------------------------------------- */
/*  Main page                                                              */
/* ---------------------------------------------------------------------- */

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const activeSection = useActiveSection(NAV_ITEMS.map((s) => s.id));

  const heroSpotlight = useSpotlight();

  const filteredExperiences = activeFilter
    ? experiences.filter((exp: Experience) => exp.technologies.includes(activeFilter))
    : experiences;

  const filteredProjects = activeFilter
    ? projects.filter((proj: Project) => proj.technologies.includes(activeFilter))
    : projects;

  const allTechStack = useMemo(
    () =>
      Array.from(
        new Set([...experiences.flatMap((e) => e.technologies), ...projects.flatMap((p) => p.technologies)])
      ),
    []
  );

  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ['start 0.8', 'end 0.5'],
  });
  const lineHeight = useTransform(timelineProgress, [0, 1], ['0%', '100%']);

  return (
    <>
      <GradientMesh />
      <ScrollProgressBar />
      <FloatingNav active={activeSection} />

      <main className="relative min-h-screen overflow-x-clip text-ink">
        <div className="mx-auto max-w-5xl px-6 py-28 sm:px-10 md:px-16">
          {/* -------------------------------------------------------- */}
          {/* HOME                                                      */}
          {/* -------------------------------------------------------- */}
          <section
            id="home"
            ref={heroSpotlight.ref}
            onMouseMove={heroSpotlight.handleMove}
            className="relative mb-40 min-h-[70vh] scroll-mt-24 pt-16"
          >
            {/* Oversized so the spotlight fades out before it meets the layer's edge;
                the calc() offsets cancel the -inset-24 (96px) overhang. */}
            <div
              className="pointer-events-none absolute -inset-24"
              style={{
                background:
                  'radial-gradient(560px circle at calc(var(--mx, 50%) + 96px) calc(var(--my, 40%) + 96px), rgba(139,92,246,0.13), transparent 70%)',
              }}
            />

            <HeroOrbs name={userProfile.name} />

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative">
              <motion.div
                variants={fadeIn}
                className="glass mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan ring-2 ring-white" />
                </span>
                <span className="text-sm font-medium text-ink-dim">Open to enterprise engineering work</span>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                className="gradient-text mb-6 font-display text-6xl font-semibold leading-[1.02] tracking-tight sm:text-7xl md:text-8xl"
              >
                {userProfile.name}
              </motion.h1>

              <motion.p variants={fadeIn} className="mb-4 font-display text-2xl font-medium text-ink sm:text-3xl">
                {userProfile.title}
              </motion.p>

              <motion.p variants={fadeIn} className="mb-10 max-w-xl text-lg leading-relaxed text-ink-dim">
                {userProfile.bio}
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
                <Magnetic>
                  <a
                    href={`mailto:${userProfile.email}`}
                    className="btn-primary inline-block rounded-full px-7 py-3 text-sm font-semibold"
                  >
                    Get in touch
                  </a>
                </Magnetic>
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-purple-deep"
                >
                  GitHub
                </a>
                <a
                  href={userProfile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-purple-deep"
                >
                  LinkedIn
                </a>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-16 text-sm text-ink-dim">
                {userProfile.location}
              </motion.div>
            </motion.div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Tech filter                                               */}
          {/* -------------------------------------------------------- */}
          <section className="mb-32">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Stack</h2>
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="text-sm font-medium text-purple-deep hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {allTechStack.map((tech, i) => {
                const isActive = activeFilter === tech;
                return (
                  <button
                    key={tech}
                    onClick={() => setActiveFilter(isActive ? null : tech)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-ink text-white shadow-[0_12px_24px_-10px_rgba(38,25,63,0.7)]'
                        : 'glass text-ink'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${ACCENT[accentAt(i)].dot}`} />
                    {tech}
                  </button>
                );
              })}
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* TIMELINE                                                   */}
          {/* -------------------------------------------------------- */}
          <section id="timeline" className="mb-32 scroll-mt-24">
            <h2 className="mb-12 font-display text-3xl font-semibold tracking-tight text-ink">Timeline</h2>

            <div ref={timelineRef} className="relative pl-8">
              <div className="absolute bottom-1 left-0 top-1 w-px bg-ink/15" />
              <motion.div
                className="absolute left-0 top-1 w-[2px] origin-top -translate-x-[0.5px] rounded-full bg-gradient-to-b from-purple via-pink via-50% to-yellow"
                style={{ height: lineHeight }}
              />

              <div className="space-y-16">
                {filteredExperiences.map((exp: Experience) => {
                  const accent = ACCENT[accentAt(experiences.findIndex((e) => e.id === exp.id))];
                  return (
                    <div key={exp.id} className="group relative">
                      <span
                        className={`absolute -left-8 top-2 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4 ring-white transition-transform duration-300 group-hover:scale-125 ${accent.dot}`}
                      />

                      <div
                        className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold text-ink ${accent.tint}`}
                      >
                        {exp.period}
                      </div>
                      <h3 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">
                        {exp.role}
                        <span className="font-sans text-base font-normal text-ink-dim"> at {exp.company}</span>
                      </h3>
                      <p className="mb-4 text-sm text-ink-dim">{exp.location}</p>

                      <ul className="mb-5 max-w-2xl space-y-2.5 leading-relaxed text-ink-dim">
                        {exp.description.map((desc: string, idx: number) => (
                          <li key={idx} className="flex gap-3">
                            <span className={`mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
                            <span>{desc}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map((tech: string, idx: number) => (
                          <span
                            key={idx}
                            className="chip rounded-full px-3 py-1 text-xs font-medium text-ink-dim"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* WORK — bento grid, spotlight glass cards                  */}
          {/* -------------------------------------------------------- */}
          <section id="work" className="mb-32 scroll-mt-24">
            <h2 className="mb-12 font-display text-3xl font-semibold tracking-tight text-ink">Work</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredProjects.map((project: Project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  accent={accentAt(projects.findIndex((p) => p.id === project.id))}
                />
              ))}
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* CONTACT / FOOTER                                           */}
          {/* -------------------------------------------------------- */}
          <section
            id="contact"
            className="glass relative scroll-mt-24 overflow-hidden rounded-[2rem] p-10 text-center sm:p-16"
          >
            {/* Corner colour so the glass has something to refract */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-purple opacity-40 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 -top-12 h-56 w-56 rounded-full bg-yellow opacity-60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-pink opacity-40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-cyan opacity-45 blur-3xl" />

            <div className="relative">
              <h2 className="gradient-text mb-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Let&apos;s build something
              </h2>
              <p className="mx-auto mb-8 max-w-md text-lg text-ink-dim">
                Open to enterprise engineering roles and full-stack projects.
              </p>
              <Magnetic>
                <a
                  href={`mailto:${userProfile.email}`}
                  className="btn-primary inline-block rounded-full px-8 py-3.5 text-sm font-semibold"
                >
                  {userProfile.email}
                </a>
              </Magnetic>

              <div className="mt-10 flex items-center justify-center gap-6 text-sm font-medium text-ink-dim">
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-purple-deep"
                >
                  GitHub
                </a>
                <span className="text-ink/30">·</span>
                <a
                  href={userProfile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-purple-deep"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </section>

          <footer className="mt-16 text-center text-xs text-ink-dim">
            {userProfile.name} — {new Date().getFullYear()}
          </footer>
        </div>
      </main>
    </>
  );
}
