// src/data/portfolio.ts
import { UserProfile, Experience, Project } from '@/types';

export const userProfile: UserProfile = {
    name: "Ayumi Hidalgo",
    title: "Software Engineer",
    bio: "DOST-SEI Scholar and Software Engineer specializing in full-stack web development. Building robust enterprise applications, HRIS platforms, and data analytics reporting systems using modern frameworks.",
    location: "San Pedro, Laguna, Philippines",
    email: "hidalgoayumi0613@gmail.com",
    github: "https://github.com/ayumihidalgo",
    linkedin: "https://www.linkedin.com/in/ayumi-hidalgo-1b8178219/",
};

export const experiences: Experience[] = [
    {
        id: "se-fulltime",
        role: "Software Engineer",
        company: "Pro Board Technology Services Corporation",
        location: "Carmona, Cavite",
        period: "2026 - Present",
        description: [
            "Transitioned to full-time Software Engineer, architecting and maintaining full-stack web applications across multiple enterprise environments.",
            "Developed and optimized complex business systems including Human Resource Information System (HRIS) applications and data analytics reporting platforms.",
            "Engineered both front-end user interfaces and robust backend logic, implementing secure database structures, unit testing, and Role-Based Access Control (RBAC)."
        ],
        technologies: ["C#", "ASP.NET Core", "ASP.NET MVC", "VB.NET", "Next.js", "TypeScript", "SQL Server", "Unit Testing"]
    },
    {
        id: "pbts-intern",
        role: "Business Systems & Support Intern",
        company: "Pro Board Technology Services Corporation",
        location: "Carmona, Cavite",
        period: "2026",
        description: [
            "Engineered server-side back-end logic from scratch for the NEW ERA HRIS project, transforming static front-end prototypes into fully functional, database-driven applications.",
            "Programmed and integrated Role-Based Access Control (RBAC) mechanisms into internal portals like HRIS Proboard to enforce strict authentication and user permission levels.",
            "Conducted workflow analysis, mapping complex end-to-end human resource transactions into efficient system architectures.",
            "Designed corporate branding assets, official Friday apparel concepts across four sub-companies, and 20th-anniversary commemorative wear."
        ],
        technologies: ["C#", "ASP.NET Core", "Blazor Server", "SQL Server", "TypeScript", "Tailwind CSS"]
    }
];

export const projects: Project[] = [
    {
        id: "hris-enterprise",
        title: "Enterprise HRIS & Application Systems",
        description: "Comprehensive Human Resource Information System handling employee lifecycle workflows, automated record management, and secure administrative access controls.",
        technologies: ["ASP.NET Core", "C#", "SQL Server", "TypeScript", "Tailwind CSS"],
        featured: true,
    },
    {
        id: "analytics-reporting",
        title: "Data Analytics Reporting System",
        description: "Interactive data visualization dashboard featuring real-time analytics, custom filtering controls, and optimized backend query processing.",
        technologies: ["Next.js", "TypeScript", "Chart.js", "SQL Server"],
        featured: true,
    },
    {
        id: "corporate-web",
        title: "Corporate Web Platform & Portals",
        description: "Modern, high-performance corporate showcase and internal support websites optimized for responsiveness, clean typography, and fast deployment.",
        technologies: ["Next.js", "Tailwind CSS", "Vite", "ASP.NET MVC"],
        featured: true,
    }
];
