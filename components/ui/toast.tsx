"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

/* ─── Visual config per variant ─── */
const variants = {
  success: {
    icon: CheckCircle2,
    accent: "bg-success-500",
    iconBg: "bg-success-100",
    iconColor: "text-success-600",
    bar: "bg-success-400",
  },
  error: {
    icon: XCircle,
    accent: "bg-error-500",
    iconBg: "bg-error-100",
    iconColor: "text-error-600",
    bar: "bg-error-400",
  },
  warning: {
    icon: AlertTriangle,
    accent: "bg-warning-500",
    iconBg: "bg-warning-100",
    iconColor: "text-warning-600",
    bar: "bg-warning-400",
  },
  info: {
    icon: Info,
    accent: "bg-primary-400",
    iconBg: "bg-primary-50",
    iconColor: "text-primary-500",
    bar: "bg-primary-300",
  },
} as const;

type Variant = keyof typeof variants;

/* ─── Custom Toast Component ─── */
function MpsToast({
  id,
  variant,
  title,
  description,
  duration = 4000,
}: {
  id: string | number;
  variant: Variant;
  title: string;
  description?: string;
  duration?: number;
}) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className="relative flex w-[calc(100vw-2rem)] sm:w-[356px] overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-bg-card shadow-xl">
      {/* Accent strip */}
      <div className={`w-1 shrink-0 ${v.accent}`} />

      {/* Content */}
      <div className="flex flex-1 items-start gap-3 px-3.5 py-3">
        {/* Icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${v.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${v.iconColor}`} strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-bold text-text-primary leading-tight">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-[13px] text-text-muted leading-snug">
              {description}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-1 right-0 h-[2px] bg-gray-100">
        <div
          className={`h-full ${v.bar} rounded-full`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Toaster (renders Sonner container) ─── */
function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        unstyled: true,
        className: "!p-0 !bg-transparent !border-0 !shadow-none",
      }}
    />
  );
}

/* ─── Toast API (wraps sonner with custom rendering) ─── */
interface ToastOptions {
  description?: string;
  duration?: number;
}

const toast = {
  success(title: string, opts?: ToastOptions) {
    const duration = opts?.duration ?? 4000;
    return sonnerToast.custom(
      (id) => (
        <MpsToast
          id={id}
          variant="success"
          title={title}
          description={opts?.description}
          duration={duration}
        />
      ),
      { duration }
    );
  },

  error(title: string, opts?: ToastOptions) {
    const duration = opts?.duration ?? 5000;
    return sonnerToast.custom(
      (id) => (
        <MpsToast
          id={id}
          variant="error"
          title={title}
          description={opts?.description}
          duration={duration}
        />
      ),
      { duration }
    );
  },

  warning(title: string, opts?: ToastOptions) {
    const duration = opts?.duration ?? 4500;
    return sonnerToast.custom(
      (id) => (
        <MpsToast
          id={id}
          variant="warning"
          title={title}
          description={opts?.description}
          duration={duration}
        />
      ),
      { duration }
    );
  },

  info(title: string, opts?: ToastOptions) {
    const duration = opts?.duration ?? 4000;
    return sonnerToast.custom(
      (id) => (
        <MpsToast
          id={id}
          variant="info"
          title={title}
          description={opts?.description}
          duration={duration}
        />
      ),
      { duration }
    );
  },

  dismiss: sonnerToast.dismiss,
};

export { Toaster, toast };
