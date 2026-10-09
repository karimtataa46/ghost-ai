import {
  FileText,
  Ghost,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Suspense, type ReactNode } from "react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-12 border-r border-surface-border bg-surface p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <Ghost className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-copy-primary">
            Ghost AI
          </span>
        </div>

        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-6">
            <h1 className="max-w-sm text-3xl font-bold tracking-tight text-copy-primary xl:max-w-md xl:text-4xl">
              Design systems at the speed of thought.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-copy-muted xl:text-xl">
              Describe your architecture in plain English. Ghost AI maps it to a
              shared canvas your whole team can refine in real time.
            </p>
          </div>

          <ul className="flex flex-col gap-9">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-accent-dim text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium text-copy-primary">
                    {title}
                  </h2>
                  <p className="text-copy-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-base px-4 py-8 lg:px-12">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
