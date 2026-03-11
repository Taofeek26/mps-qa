"use client";

import { User, Mail, Shield, Building2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSites } from "@/lib/mock-data";

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin",
  admin: "Admin",
  site_user: "Site User",
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const allSites = getSites();
  const assignedSites =
    user.role === "admin" || user.role === "system_admin"
      ? allSites
      : allSites.filter((s) => user.assignedSiteIds?.includes(s.id));

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Your account information
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-400 text-text-inverse text-xl font-bold">
            {initials}
          </div>
          <div className="space-y-4 min-w-0 flex-1">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {user.displayName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
                <Badge variant={user.active ? "success" : "neutral"}>
                  {user.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-text-secondary truncate">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Shield className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-text-secondary">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <User className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-text-secondary">ID: {user.id}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">
            Assigned Sites
          </h3>
          <Badge variant="neutral" className="ml-auto">
            {assignedSites.length}
          </Badge>
        </div>
        {assignedSites.length === 0 ? (
          <p className="text-sm text-text-muted">No sites assigned.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {assignedSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-border-default bg-bg-base p-3 text-sm"
              >
                <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {site.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {[site.city, site.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
