"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SectionConfig } from "@/lib/report-builder-types";

interface NotesBlockProps {
  config: SectionConfig;
  onConfigChange?: (config: Partial<SectionConfig>) => void;
  readOnly?: boolean;
}

export function NotesBlock({ config, onConfigChange, readOnly }: NotesBlockProps) {
  if (readOnly) {
    return config.notes ? (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{config.notes}</p>
        </CardContent>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <textarea
          value={config.notes ?? ""}
          onChange={(e) => onConfigChange?.({ notes: e.target.value })}
          placeholder="Add notes, commentary, or context for this report..."
          className="w-full min-h-[80px] resize-y rounded-[var(--radius-sm)] border border-border-default bg-bg-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
        />
      </CardContent>
    </Card>
  );
}
