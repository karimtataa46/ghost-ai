"use client";

import { useCallback, useState } from "react";

import { slugify } from "@/lib/slugify";
import type { Project } from "@/types/project";

// In-memory only: the list resets on reload until the project API exists.
export function useProjectList(initialProjects: Project[]) {
  const [projects, setProjects] = useState(initialProjects);

  const createProject = useCallback((name: string) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      slug: slugify(name),
      isOwner: true,
    };
    setProjects((current) => [project, ...current]);
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, name } : project
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((current) => current.filter((project) => project.id !== id));
  }, []);

  return { projects, createProject, renameProject, deleteProject };
}
