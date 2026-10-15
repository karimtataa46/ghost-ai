// A person in the room other than the viewer, as the avatar group shows them.
export interface Participant {
  // The Clerk user ID, from the Liveblocks session.
  id: string;
  name: string;
  // Absent when the person has no profile picture.
  avatar?: string;
}
