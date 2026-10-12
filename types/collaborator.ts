// A project collaborator as the share dialog shows it. Collaborators are stored by email;
// `name` and `imageUrl` come from Clerk and are null when no Clerk user has that email.
export interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}
