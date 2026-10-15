"use client";

import { LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react/suspense";

import type { NodeFill, NodeShape, ShapeColors } from "@/types/canvas";

// The colors picked for each shape, read from and written to the room's Storage (`shapeColors`),
// so a pick reaches every collaborator and every node of that shape. Must run inside a room, and
// suspends until Storage is ready like `useLiveblocksFlow` does, so call it under the same
// `ClientSideSuspense`.
export function useShapeColorStorage() {
  const colors: ShapeColors | undefined = useStorage((root) => root.shapeColors);

  const setColor = useMutation(
    ({ storage }, shape: NodeShape, fill: NodeFill) => {
      const shapeColors = storage.get("shapeColors");
      if (shapeColors) {
        shapeColors.set(shape, fill);
      } else {
        // A room created before `initialStorage` had this key: make it on the first pick.
        const initial: ShapeColors = { [shape]: fill };
        storage.set("shapeColors", new LiveObject(initial));
      }
    },
    [],
  );

  return { colors, setColor };
}
