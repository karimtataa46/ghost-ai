import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";

export default function EditorPage() {
  return (
    <EditorShell>
      <div className="bg-grid flex flex-1 items-center justify-center px-4 py-8">
        <EditorHome />
      </div>
    </EditorShell>
  );
}
