// The sidebar's view of a project. Owned and shared projects come in separate lists.
export interface Project {
  id: string;
  name: string;
}

// A project opened in the workspace, with the viewer's role: only the owner manages access.
export interface WorkspaceProject extends Project {
  isOwner: boolean;
}
