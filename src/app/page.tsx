// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { userProfile, experiences, projects } from '@/data/portfolio';
import { Experience, Project } from '@/types';
import { fadeIn } from '@/utils/animations';

export default function Home() {
  const [activeTechFilter, setActiveTechFilter] = useState<string | null>(null);

  const filteredExperiences = activeTechFilter
    ? experiences.filter((exp: Experience) => exp.technologies.includes(activeTechFilter))
    : experiences;

  const filteredProjects = activeTechFilter
    ? projects.filter((proj: Project) => proj.technologies.includes(activeTechFilter))
    : projects;

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#171717] selection:bg-neutral-200 px-6 md:px-24 lg:px-48 py-16 font-sans transition-colors duration-300">

      {/* Top Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-12 flex justify-between items-center border-b border-neutral-200 pb-4"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-semibold text-neutral-500">
            {userProfile.name} — Portfolio
          </span>
        </div>
        <span className="text-xs text-neutral-400 font-medium">
          Software Engineer
        </span>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          {/* Hero Section */}
          <section className="mb-14">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 font-serif">
              {userProfile.name}
            </h1>
            <p className="text-lg text-neutral-600 font-medium mb-4">
              {userProfile.title}
            </p>
            <p className="text-neutral-500 leading-relaxed text-sm md:text-base">
              {userProfile.bio}
            </p>
          </section>

          {/* Active Filter Notice */}
          {activeTechFilter && (
            <div className="mb-6 flex items-center justify-between bg-neutral-100 px-4 py-2 rounded-lg text-xs font-medium text-neutral-700 border border-neutral-200">
              <span>Filtering by tech: <strong className="text-black">{activeTechFilter}</strong></span>
              <button
                onClick={() => setActiveTechFilter(null)}
                className="text-neutral-500 hover:text-black underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Experience Section */}
          <section className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">
              Experience
            </h2>
            <div className="space-y-8">
              {filteredExperiences.map((exp: Experience) => (
                <motion.div
                  key={exp.id}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="group border-l-2 border-neutral-200 pl-4 transition-colors hover:border-neutral-900"
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-neutral-900">
                      {exp.role} <span className="text-neutral-400 font-normal">at {exp.company}</span>
                    </h3>
                    <span className="text-xs text-neutral-400">{exp.period}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">{exp.location}</p>
                  <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 mb-4">
                    {exp.description.map((desc: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{desc}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.technologies.map((tech: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTechFilter(activeTechFilter === tech ? null : tech)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${activeTechFilter === tech
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200/60 hover:border-neutral-400'
                          }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Selected Projects Section */}
          <section className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">
              Selected Projects
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredProjects.map((project: Project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 rounded-xl border border-neutral-200/80 bg-white shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <h3 className="font-semibold text-neutral-900 mb-1 relative z-10">{project.title}</h3>
                  <p className="text-sm text-neutral-600 mb-4 relative z-10">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 relative z-10">
                    {project.technologies.map((tech: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTechFilter(activeTechFilter === tech ? null : tech)}
                        className={`text-xs px-2 py-0.5 rounded border transition-all cursor-pointer ${activeTechFilter === tech
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Footer / Connect */}
          <footer className="border-t border-neutral-200 pt-8 flex justify-between items-center text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} Ayumi Hidalgo</p>
            <div className="flex gap-4">
              <a href={userProfile.github} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">GitHub</a>
              <a href={userProfile.linkedin} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">LinkedIn</a>
              <a href={`mailto:${userProfile.email}`} className="hover:text-black transition-colors">Email</a>
            </div>
          </footer>
        </motion.div>
      </div>

    </main>
  );
}