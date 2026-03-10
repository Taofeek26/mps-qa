"use client";

import * as React from "react";
import { FileUp, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type EntryMode = "upload" | "manual";

interface EntryChoiceProps {
  onChoose: (mode: EntryMode) => void;
  className?: string;
}

export function EntryChoice({ onChoose, className }: EntryChoiceProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border-default bg-bg-card shadow-sm",
        "p-8 sm:p-12",
        className
      )}
    >
      <div className="text-left mb-10">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          How would you like to add shipments?
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary max-w-lg leading-relaxed">
          Upload a file for bulk import, or enter data in the grid and use paste, duplicate, and fill-down to work fast.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <button
          type="button"
          onClick={() => onChoose("upload")}
          className={cn(
            "group relative flex flex-col items-start gap-5 rounded-xl border border-border-default bg-bg-card p-8 text-left",
            "shadow-sm hover:shadow-md hover:border-primary-300/60 hover:bg-primary-50/30",
            "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          )}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 shadow-inner group-hover:bg-primary-200/80 transition-colors">
            <FileUp className="h-7 w-7" strokeWidth={2} />
          </span>
          <div className="w-full text-left">
            <span className="font-semibold text-base text-text-primary block">Upload data</span>
            <span className="text-sm text-text-secondary mt-1 block leading-relaxed">
              Import from Excel or CSV. We map columns and show a preview so you can review before submitting.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChoose("manual")}
          className={cn(
            "group relative flex flex-col items-start gap-5 rounded-xl border border-border-default bg-bg-card p-8 text-left",
            "shadow-sm hover:shadow-md hover:border-primary-300/60 hover:bg-primary-50/30",
            "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          )}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 shadow-inner group-hover:bg-primary-200/80 transition-colors">
            <PenLine className="h-7 w-7" strokeWidth={2} />
          </span>
          <div className="w-full text-left">
            <span className="font-semibold text-base text-text-primary block">Manually enter data</span>
            <span className="text-sm text-text-secondary mt-1 block leading-relaxed">
              Use the grid to type or paste from Excel. Add rows in bulk, duplicate rows, and fill down to enter data quickly.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
