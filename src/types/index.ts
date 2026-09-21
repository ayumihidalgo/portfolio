// src/types/index.ts

export interface Project {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    liveUrl?: string;
    githubUrl?: string;
    featured: boolean;
}

export interface Experience {
    id: string;
    role: string;
    company: string;
    location: string;
    period: string;
    description: string[];
    technologies: string[];
}

export interface UserProfile {
    name: string;
    title: string;
    bio: string;
    location: string;
    email: string;
    github: string;
    linkedin: string;
}
