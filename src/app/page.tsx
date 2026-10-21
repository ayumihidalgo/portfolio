// src/app/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { userProfile, experiences, projects } from '@/data/portfolio';
import { Experience, Project } from '@/types';
import { fadeIn, staggerContainer } from '@/utils/animations';

const Scene3D = dynamic(() => import('@/components/scene-3d'), { ssr: false });

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
] as const;

/* ---------------------------------------------------------------------- */
/*  Top scroll-progress bar                                               */
/* ---------------------------------------------------------------------- */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.2 });
  return (
    <motion.div
      className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left bg-gradient-to-r from-violet via-cyan to-pink"
      style={{ scaleX }}
    />
  );
}

/* ---------------------------------------------------------------------- */
/*  Floating glass nav with a sliding gradient indicator                  */
/* ---------------------------------------------------------------------- */

function FloatingNav({ active }: { active: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="fixed left-1/2 top-5 z-50 hidden -translate-x-1/2 sm:block">
      <div className="flex items-center gap-1 rounded-full border border-glass-border bg-glass px-1.5 py-1.5 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="relative rounded-full px-4 py-1.5 text-sm text-ink-dim transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="navIndicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet to-cyan"
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'text-ink' : ''}`}>{item.label}</span>
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
/*  TiltCard — real 3D rotation tracking the cursor, via CSS perspective  */
/* ---------------------------------------------------------------------- */

function TiltCard({
  children,
  className = '',
  maxTilt = 10,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);
  const springRotateX = useSpring(rotateX, { stiffness: 180, damping: 18 });
  const springRotateY = useSpring(rotateY, { stiffness: 180, damping: 18 });
  const springScale = useSpring(scale, { stiffness: 180, damping: 18 });
  const reduceMotion = useReducedMotion();

  const handleMove = (e: React.MouseEvent) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxTilt * 2);
    rotateX.set(-py * maxTilt * 2);
    scale.set(1.015);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: springScale,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Fibonacci-sphere point distribution, used by SkillsSphere             */
/* ---------------------------------------------------------------------- */

function useFibonacciSphere(n: number, radius: number) {
  return useMemo(() => {
    const pts: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = n > 1 ? 1 - (i / (n - 1)) * 2 : 0;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      pts.push({ x: Math.cos(theta) * r * radius, y: y * radius, z: Math.sin(theta) * r * radius });
    }
    return pts;
  }, [n, radius]);
}

/* ---------------------------------------------------------------------- */
/*  SkillsSphere — a draggable, auto-rotating 3D tag cloud (pure CSS 3D)  */
/* ---------------------------------------------------------------------- */

function SkillsSphere({
  tags,
  activeTag,
  onToggle,
}: {
  tags: string[];
  activeTag: string | null;
  onToggle: (tag: string) => void;
}) {
  const radius = 150;
  const points = useFibonacciSphere(tags.length, radius);
  const tagRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotation = useRef({ x: -0.2, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!dragging.current && !reduceMotion) {
        rotation.current.y += 0.0035;
      }
      const cosY = Math.cos(rotation.current.y);
      const sinY = Math.sin(rotation.current.y);
      const cosX = Math.cos(rotation.current.x);
      const sinX = Math.sin(rotation.current.x);

      points.forEach((p, i) => {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const el = tagRefs.current[i];
        if (!el) return;
        const depth = (z2 + radius) / (radius * 2);
        const scale = 0.55 + depth * 0.65;
        const opacity = 0.25 + depth * 0.75;
        el.style.transform = `translate3d(calc(-50% + ${x1}px), calc(-50% + ${y2}px), ${z2}px) scale(${scale})`;
        el.style.opacity = `${opacity}`;
        el.style.zIndex = `${Math.round(z2 * 100)}`;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [points, radius, reduceMotion]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    rotation.current.y += dx * 0.005;
    rotation.current.x = Math.max(-1.1, Math.min(1.1, rotation.current.x + dy * 0.005));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className="relative mx-auto h-[340px] w-full max-w-xl cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ perspective: 900 }}
    >
      <div className="absolute left-1/2 top-1/2">
        {tags.map((tag, i) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              ref={(el) => {
                tagRefs.current[i] = el;
              }}
              onClick={() => onToggle(tag)}
              className={`absolute whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors ${
                isActive
                  ? 'border-cyan bg-cyan/20 text-ink'
                  : 'border-glass-border bg-glass-strong text-ink-dim hover:text-ink'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ExperienceCarousel — 3D coverflow through the timeline                */
/* ---------------------------------------------------------------------- */

function ExperienceCarousel({ experiences }: { experiences: Experience[] }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (index > experiences.length - 1) setIndex(0);
  }, [experiences.length, index]);

  if (experiences.length === 0) {
    return <p className="text-center text-sm text-ink-dim">No roles match that filter.</p>;
  }

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + experiences.length) % experiences.length);
  };

  return (
    <div>
      <div className="relative mx-auto h-[600px] sm:h-[440px]" style={{ perspective: 1400 }}>
        {experiences.map((exp, i) => {
          let offset = i - index;
          if (offset > experiences.length / 2) offset -= experiences.length;
          if (offset < -experiences.length / 2) offset += experiences.length;
          const isActive = offset === 0;
          const abs = Math.abs(offset);
          const visible = abs <= 2;

          const transform = reduceMotion
            ? 'translate(-50%, 0)'
            : `translate(-50%, 0) translateX(${offset * 46}%) translateZ(${-abs * 220}px) rotateY(${
                offset * -32
              }deg) scale(${1 - abs * 0.14})`;

          return (
            <div
              key={exp.id}
              onClick={() => !isActive && setIndex(i)}
              className={`absolute left-1/2 top-0 w-[300px] rounded-2xl border border-glass-border bg-glass p-7 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-out sm:w-[420px] ${
                isActive ? 'cursor-default' : 'cursor-pointer'
              } ${visible ? '' : 'pointer-events-none opacity-0'}`}
              style={{ transform, opacity: visible ? 1 - abs * 0.3 : 0, zIndex: 10 - abs }}
            >
              <div className="mb-1 text-sm text-ink-dim">{exp.period}</div>
              <h3 className="mb-1 font-display text-xl font-medium text-ink">{exp.role}</h3>
              <p className="mb-4 text-sm text-ink-dim">
                {exp.company} — {exp.location}
              </p>
              <ul className="mb-5 space-y-2 text-sm leading-relaxed text-ink-dim">
                {exp.description.slice(0, 2).map((desc, di) => (
                  <li key={di} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-glass-border" />
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {exp.technologies.slice(0, 6).map((tech, ti) => (
                  <span
                    key={ti}
                    className="rounded-full border border-glass-border bg-glass-strong px-2.5 py-1 font-mono text-[10px] text-ink-dim"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous role"
          className="rounded-full border border-glass-border bg-glass px-4 py-2 text-sm text-ink-dim backdrop-blur-xl transition-colors hover:text-ink"
        >
          ‹ Prev
        </button>
        <div className="flex gap-2">
          {experiences.map((exp, i) => (
            <button
              key={exp.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to ${exp.role}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-gradient-to-r from-violet to-cyan' : 'w-1.5 bg-glass-border'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Next role"
          className="rounded-full border border-glass-border bg-glass px-4 py-2 text-sm text-ink-dim backdrop-blur-xl transition-colors hover:text-ink"
        >
          Next ›
        </button>
      </div>
    </div>
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
/*  Project card — bento sizing driven by the `featured` flag, tilt + glow */
/* ---------------------------------------------------------------------- */

function ProjectCard({ project }: { project: Project }) {
  const { ref, handleMove } = useSpotlight();

  return (
    <TiltCard
      maxTilt={6}
      className={`group relative overflow-hidden rounded-2xl ${project.featured ? 'md:col-span-2' : ''}`}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        className="relative h-full rounded-2xl border border-glass-border bg-glass p-7 backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(500px circle at var(--mx) var(--my), rgba(139,92,246,0.18), transparent 60%)',
          }}
        />
        <div className="relative" style={{ transform: 'translateZ(26px)', transformStyle: 'preserve-3d' }}>
          <h3 className="mb-3 font-display text-xl font-medium text-ink">{project.title}</h3>
          <p className="mb-6 max-w-lg text-sm leading-relaxed text-ink-dim">{project.description}</p>

          <div className="mb-5 flex flex-wrap gap-2">
            {project.technologies.map((tech, i) => (
              <span
                key={i}
                className="rounded-full border border-glass-border bg-glass-strong px-3 py-1 font-mono text-[11px] text-ink-dim"
              >
                {tech}
              </span>
            ))}
          </div>

          {(project.liveUrl || project.githubUrl) && (
            <div className="flex gap-5 border-t border-glass-border pt-4">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-ink-dim transition-colors hover:text-cyan"
                >
                  Live site
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-ink-dim transition-colors hover:text-cyan"
                >
                  Source
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </TiltCard>
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
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);

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

  return (
    <>
      <Scene3D />
      <div className="grain-overlay pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <ScrollProgressBar />
      <FloatingNav active={activeSection} />

      <main className="relative min-h-screen text-ink">
        <div className="mx-auto max-w-5xl px-6 py-28 sm:px-10 md:px-16">
          {/* -------------------------------------------------------- */}
          {/* HOME                                                      */}
          {/* -------------------------------------------------------- */}
          <section id="home" className="relative mb-40 min-h-[70vh] scroll-mt-24 pt-16">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative">
              <motion.div
                variants={fadeIn}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-1.5 backdrop-blur-xl"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
                </span>
                <span className="text-sm text-ink-dim">Open to enterprise engineering work</span>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                className="gradient-text mb-6 font-display text-6xl font-semibold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl"
              >
                {userProfile.name}
              </motion.h1>

              <motion.p variants={fadeIn} className="mb-4 font-display text-2xl text-ink-dim sm:text-3xl">
                {userProfile.title}
              </motion.p>

              <motion.p variants={fadeIn} className="mb-10 max-w-xl text-base leading-relaxed text-ink-dim">
                {userProfile.bio}
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
                <Magnetic>
                  <a
                    href={`mailto:${userProfile.email}`}
                    className="inline-block rounded-full bg-gradient-to-r from-violet to-cyan px-7 py-3 text-sm font-medium text-bg shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)] transition-shadow hover:shadow-[0_0_45px_-8px_rgba(34,211,238,0.8)]"
                  >
                    Get in touch
                  </a>
                </Magnetic>
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-glass-border bg-glass px-6 py-3 text-sm text-ink-dim backdrop-blur-xl transition-colors hover:text-ink"
                >
                  GitHub
                </a>
                <a
                  href={userProfile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-glass-border bg-glass px-6 py-3 text-sm text-ink-dim backdrop-blur-xl transition-colors hover:text-ink"
                >
                  LinkedIn
                </a>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-16 font-mono text-xs text-ink-dim/70">
                {userProfile.location}
              </motion.div>
            </motion.div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Tech filter — gradient-border chips                       */}
          {/* -------------------------------------------------------- */}
          <section className="mb-32">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-medium text-ink">Stack</h2>
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="text-sm text-cyan hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <p className="mb-2 text-sm text-ink-dim">Drag to rotate. Tap a skill to filter the work below.</p>
            <SkillsSphere
              tags={allTechStack}
              activeTag={activeFilter}
              onToggle={(tech) => setActiveFilter(activeFilter === tech ? null : tech)}
            />
          </section>

          {/* -------------------------------------------------------- */}
          {/* TIMELINE                                                   */}
          {/* -------------------------------------------------------- */}
          <section id="timeline" className="mb-32 scroll-mt-24">
            <h2 className="mb-2 font-display text-lg font-medium text-ink">Timeline</h2>
            <p className="mb-10 text-sm text-ink-dim">Click a side card, use the arrows, or the dots to browse.</p>
            <ExperienceCarousel experiences={filteredExperiences} />
          </section>

          {/* -------------------------------------------------------- */}
          {/* WORK — bento grid, tilt + spotlight glass cards            */}
          {/* -------------------------------------------------------- */}
          <section id="work" className="mb-32 scroll-mt-24">
            <h2 className="mb-12 font-display text-lg font-medium text-ink">Work</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredProjects.map((project: Project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* CONTACT / FOOTER                                           */}
          {/* -------------------------------------------------------- */}
          <section id="contact" className="scroll-mt-24">
            <TiltCard maxTilt={3} className="rounded-3xl">
              <div className="rounded-3xl border border-glass-border bg-glass p-10 text-center backdrop-blur-xl sm:p-16">
                <h2 className="gradient-text mb-4 font-display text-3xl font-semibold sm:text-4xl">
                  Let&apos;s build something
                </h2>
                <p className="mx-auto mb-8 max-w-md text-ink-dim">
                  Open to enterprise engineering roles and full-stack projects.
                </p>
                <Magnetic>
                  <a
                    href={`mailto:${userProfile.email}`}
                    className="inline-block rounded-full bg-gradient-to-r from-violet to-cyan px-8 py-3.5 text-sm font-medium text-bg shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)] transition-shadow hover:shadow-[0_0_45px_-8px_rgba(34,211,238,0.8)]"
                  >
                    {userProfile.email}
                  </a>
                </Magnetic>

                <div className="mt-10 flex items-center justify-center gap-6 text-sm text-ink-dim">
                  <a href={userProfile.github} target="_blank" rel="noreferrer" className="hover:text-ink">
                    GitHub
                  </a>
                  <span className="text-glass-border">·</span>
                  <a href={userProfile.linkedin} target="_blank" rel="noreferrer" className="hover:text-ink">
                    LinkedIn
                  </a>
                </div>
              </div>
            </TiltCard>
          </section>

          <footer className="mt-16 text-center text-xs text-ink-dim/60">
            {userProfile.name} {year ? `— ${year}` : ''}
          </footer>
        </div>
      </main>
    </>
  );
}
