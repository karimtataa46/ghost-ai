import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AiChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

// Shown in place of the conversation until the first message. The prompt chips fill the input.
export function AiChatEmptyState({ onSelectPrompt }: AiChatEmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 px-3 text-center">
      <span className="text-ai-text">
        <Bot className="h-8 w-8" />
      </span>
      <p className="text-sm font-medium text-copy-secondary">Design with Ghost AI</p>
      <p className="text-xs text-copy-muted">
        Describe a system and Ghost AI will help you design it. Start from an idea below.
      </p>
      <ul className="mt-2 flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSelectPrompt(prompt)}
              className="h-auto rounded-full bg-subtle px-3 py-1.5 text-xs whitespace-normal text-ai-text"
            >
              {prompt}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
