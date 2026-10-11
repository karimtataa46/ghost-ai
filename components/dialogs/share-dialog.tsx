"use client";

import { UserMinus } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { CollaboratorAvatar } from "@/components/dialogs/collaborator-avatar";
import { CopyLinkButton } from "@/components/dialogs/copy-link-button";
import { DialogError } from "@/components/dialogs/dialog-error";
import { DialogShell } from "@/components/dialogs/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollaborators } from "@/hooks/use-collaborators";
import type { WorkspaceProject } from "@/types/project";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: WorkspaceProject;
}

const INVITE_FORM_ID = "invite-collaborator-form";

// Rendered only while the dialog is open, so its state resets and the list reloads each time.
function ShareDialogBody({ project }: { project: WorkspaceProject }) {
  const {
    collaborators,
    loadError,
    isInviting,
    inviteError,
    removingId,
    removeError,
    reload,
    invite,
    remove,
  } = useCollaborators(project.id);
  const [email, setEmail] = useState("");
  const emailInput = useRef<HTMLInputElement>(null);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInviting || email.trim() === "") return;

    // The input keeps what was typed when the invite fails, so it can be corrected.
    if (await invite(email)) setEmail("");
  }

  async function handleRemove(collaboratorId: string) {
    await remove(collaboratorId);
    // The clicked button is disabled, then gone, which drops focus out of the dialog.
    emailInput.current?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      {project.isOwner && (
        <form id={INVITE_FORM_ID} onSubmit={handleInvite} className="flex flex-col gap-2">
          <label htmlFor="invite-collaborator-email" className="text-sm font-medium text-copy-secondary">
            Invite by email
          </label>
          <div className="flex gap-2">
            {/* shadcn Input's `text-base` resolves to the bg-base color here, so set the text color
                explicitly. Read-only rather than disabled while sending, so focus stays in the field. */}
            <Input
              ref={emailInput}
              id="invite-collaborator-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
              spellCheck={false}
              readOnly={isInviting}
              className="h-9 text-copy-primary"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isInviting || email.trim() === ""}
            >
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </div>
          <DialogError message={inviteError} />
        </form>
      )}

      <section aria-label="People with access" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-copy-secondary">
          Collaborators{collaborators ? ` (${collaborators.length})` : ""}
        </h3>
        {loadError ? (
          <div className="flex flex-col items-start gap-2">
            <DialogError message={loadError} />
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : collaborators === null ? (
          <p className="text-sm text-copy-muted">Loading collaborators...</p>
        ) : collaborators.length === 0 ? (
          <p className="text-sm text-copy-muted">
            {project.isOwner
              ? "No collaborators yet. Invite someone by email."
              : "No other collaborators yet."}
          </p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {collaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center gap-3 rounded-xl py-1 pr-1 pl-2 hover:bg-subtle/60"
              >
                <CollaboratorAvatar collaborator={collaborator} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-copy-primary">
                    {collaborator.name ?? collaborator.email}
                  </span>
                  {collaborator.name && (
                    <span className="truncate text-xs text-copy-muted">{collaborator.email}</span>
                  )}
                </div>
                {project.isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${collaborator.name ?? collaborator.email}`}
                    disabled={removingId !== null}
                    onClick={() => handleRemove(collaborator.id)}
                    className="text-copy-muted hover:text-state-error"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <DialogError message={removeError} />
      </section>
    </div>
  );
}

export function ShareDialog({ open, onOpenChange, project }: ShareDialogProps) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description={
        project.isOwner
          ? "Invite people by email. They can open this project after signing in with that email."
          : "People with access to this project. Only the owner can invite or remove people."
      }
      footer={<CopyLinkButton path={`/editor/${project.id}`} />}
    >
      <ShareDialogBody project={project} />
    </DialogShell>
  );
}
