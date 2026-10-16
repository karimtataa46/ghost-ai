"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import type { CanvasSaveStatus } from "@/types/canvas";

// What the Save button shows and does.
export interface CanvasSaveControls {
  status: CanvasSaveStatus;
  // Why `status` is `error`, for the button's tooltip.
  error: string | null;
  // Saves now. Null while the saved canvas is still loading, when there is nothing to save yet.
  onSave: (() => void) | null;
}

type RegisterSaveControls = (controls: CanvasSaveControls | null) => void;

const CanvasSaveContext = createContext<RegisterSaveControls | null>(null);

interface CanvasSaveProviderProps {
  // Called with the controls whenever the mounted canvas's save state changes, and with `null`
  // when it unmounts.
  onRegister: RegisterSaveControls;
  children: ReactNode;
}

// Connects the workspace navbar to the canvas, the same way `TemplateImportProvider` does for the
// Templates button: the Save button lives in the shell, outside the Liveblocks room, but the
// canvas is what knows whether it is saving. The canvas hands its controls up through this
// provider, and the shell knows there is nothing to show while no canvas is mounted (loading, or
// a failed connection).
export function CanvasSaveProvider({ onRegister, children }: CanvasSaveProviderProps) {
  return <CanvasSaveContext.Provider value={onRegister}>{children}</CanvasSaveContext.Provider>;
}

// Registers `controls` for as long as the calling component is mounted. Without a provider (a
// canvas rendered on its own) there is nothing to register with, and nothing happens. `controls`
// should keep its identity while its values do (memoize it), since a new object registers again.
export function useRegisterCanvasSave(controls: CanvasSaveControls) {
  const register = useContext(CanvasSaveContext);

  useEffect(() => {
    if (!register) return;

    register(controls);
    return () => register(null);
  }, [register, controls]);
}
