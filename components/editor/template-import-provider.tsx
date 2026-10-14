"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import type { CanvasTemplate } from "@/components/editor/starter-templates";

export type TemplateImporter = (template: CanvasTemplate) => void;

type RegisterImporter = (importer: TemplateImporter | null) => void;

const TemplateImportContext = createContext<RegisterImporter | null>(null);

interface TemplateImportProviderProps {
  // Called with the importer when a canvas mounts, and with `null` when it unmounts.
  onRegister: RegisterImporter;
  children: ReactNode;
}

// Connects the workspace navbar to the canvas. The navbar's Templates button lives in the shell,
// outside the Liveblocks room, but replacing the canvas needs the room's handlers, which only
// exist inside the canvas. So the canvas hands its importer up through this provider and the
// shell calls it, and the shell knows there is nothing to import into while no canvas is mounted
// (loading, or a failed connection).
export function TemplateImportProvider({ onRegister, children }: TemplateImportProviderProps) {
  return <TemplateImportContext.Provider value={onRegister}>{children}</TemplateImportContext.Provider>;
}

// Registers `importer` for as long as the calling component is mounted. Without a provider
// (a canvas rendered on its own) there is nothing to register with, and nothing happens.
export function useRegisterTemplateImporter(importer: TemplateImporter) {
  const register = useContext(TemplateImportContext);

  useEffect(() => {
    if (!register) return;

    register(importer);
    return () => register(null);
  }, [register, importer]);
}
