"use client";

import { Bell, Palette, Globe, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SectionHeader } from "@/components/ui/section-header";

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Manage your application preferences
        </p>
      </div>

      <Card className="p-6">
        <SectionHeader title="Notifications" className="mb-1" />
        <div className="divide-y divide-border-default">
          <SettingRow
            icon={Bell}
            label="Email notifications"
            description="Receive email alerts for shipment status changes"
          >
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow
            icon={Bell}
            label="Vendor expiration alerts"
            description="Get notified 30 days before vendor certifications expire"
          >
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow
            icon={Bell}
            label="Compliance alerts"
            description="Alerts for regulatory filing deadlines"
          >
            <Switch defaultChecked />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader title="Display" className="mb-1" />
        <div className="divide-y divide-border-default">
          <SettingRow
            icon={Palette}
            label="Compact tables"
            description="Use smaller row heights in data tables"
          >
            <Switch />
          </SettingRow>
          <SettingRow
            icon={Globe}
            label="UTC timestamps"
            description="Show all dates and times in UTC instead of local time"
          >
            <Switch />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader title="Security" className="mb-1" />
        <div className="divide-y divide-border-default">
          <SettingRow
            icon={Shield}
            label="Session timeout"
            description="Automatically sign out after 30 minutes of inactivity"
          >
            <Switch defaultChecked />
          </SettingRow>
        </div>
      </Card>

      <p className="text-xs text-text-muted">
        Settings are stored locally and will reset if you clear browser data.
      </p>
    </div>
  );
}
