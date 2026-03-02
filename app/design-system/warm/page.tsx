"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import {
  Settings,
  Plus,
  Trash2,
  Download,
  MoreHorizontal,
  Search,
  Inbox,
  Copy,
  Pencil,
  Share2,
  Bell,
  ArrowLeft,
  Menu,
  X as XIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "cards", label: "Cards" },
  { id: "headers", label: "Headers" },
  { id: "forms", label: "Forms" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navigation" },
];

/* ─── Color Swatch ─── */
function Swatch({
  label,
  hex,
  className,
}: {
  label: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-10 w-full rounded-[var(--radius-sm)] ${className}`}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-text-secondary">
          {label}
        </span>
        <span className="text-[11px] text-text-muted font-mono">{hex}</span>
      </div>
    </div>
  );
}

/* ─── Demo Box ─── */
function DemoBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-border-default bg-bg-card p-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ─── Section ─── */
function Section({
  id,
  title,
  description,
  children,
  alt,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  alt?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 ${alt ? "bg-bg-subtle -mx-6 px-6 sm:-mx-10 sm:px-10 py-12 rounded-[var(--radius-lg)]" : "py-10"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </div>
        {children}
      </motion.div>
    </section>
  );
}

/* ─── Subsection ─── */
function Sub({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── PAGE ─── */
export default function WarmDesignSystemPage() {
  const [date, setDate] = React.useState<Date | undefined>();
  const [page, setPage] = React.useState(3);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="theme-warm">
      <div className="flex min-h-screen bg-bg-app">
        {/* ── Mobile Header ── */}
        <div className="fixed top-0 left-0 right-0 z-40 lg:hidden">
          <div className="flex items-center justify-between border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4 py-3">
            <Image src="/logo.png" alt="MPS" width={64} height={22} priority />
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <XIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          {mobileNavOpen && (
            <nav className="border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4 pb-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMobileNavOpen(false)}
                    className="px-3 py-1.5 text-[13px] text-text-secondary rounded-full border border-border-default hover:bg-gray-100 hover:text-text-primary transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <Link
                href="/design-system"
                className="mt-2 flex items-center gap-1.5 text-[12px] text-primary-400 hover:text-primary-500 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Industrial Theme
              </Link>
            </nav>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-border-default bg-bg-card sticky top-0 h-screen">
          <div className="p-5 border-b border-border-default">
            <Image src="/logo.png" alt="MPS" width={80} height={28} priority />
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            <Link
              href="/design-system"
              className="flex items-center gap-1.5 px-3 py-1.5 mb-2 text-[13px] text-primary-400 rounded-[var(--radius-sm)] hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Industrial Theme
            </Link>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block px-3 py-1.5 text-[13px] text-text-secondary rounded-[var(--radius-sm)] hover:bg-gray-100 hover:text-text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-border-default">
            <p className="text-[11px] text-text-muted">Warm Theme v1.0</p>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 lg:pt-0">
          {/* Hero */}
          <div className="pt-6 sm:pt-8 lg:pt-12 pb-6 sm:pb-8 border-b border-border-default">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
                  Design System
                </p>
                <Badge variant="info">Warm</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                MPS Component Library — Warm Theme
              </h1>
              <p className="mt-2 text-sm text-text-muted max-w-lg">
                Notion / Stripe inspired variation with warm indigo accents,
                stone neutrals, and softer edges.
              </p>
            </motion.div>
          </div>

          {/* ──────────── COLORS ──────────── */}
          <Section id="colors" title="Color Palette" description="Warm indigo primary, stone neutrals, vibrant semantics.">
            <Sub title="Primary (Warm Indigo)">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                <Swatch label="50" hex="#EEF2FF" className="bg-primary-50" />
                <Swatch label="100" hex="#E0E7FF" className="bg-primary-100" />
                <Swatch label="200" hex="#C7D2FE" className="bg-primary-200" />
                <Swatch label="300" hex="#818CF8" className="bg-primary-300" />
                <Swatch label="400" hex="#6366F1" className="bg-primary-400" />
                <Swatch label="500" hex="#4F46E5" className="bg-primary-500" />
                <Swatch label="600" hex="#3730A3" className="bg-primary-600" />
                <Swatch label="700" hex="#312E81" className="bg-primary-700" />
              </div>
            </Sub>

            <Sub title="Secondary (Warm Emerald)">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Swatch label="300" hex="#6EE7B7" className="bg-secondary-300" />
                <Swatch label="400" hex="#34D399" className="bg-secondary-400" />
                <Swatch label="500" hex="#059669" className="bg-secondary-500" />
                <Swatch label="600" hex="#065F46" className="bg-secondary-600" />
              </div>
            </Sub>

            <Sub title="Neutral (Warm Stone)">
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-2">
                <Swatch label="50" hex="#FAFAF9" className="bg-gray-50" />
                <Swatch label="100" hex="#F5F5F4" className="bg-gray-100" />
                <Swatch label="200" hex="#E7E5E4" className="bg-gray-200" />
                <Swatch label="300" hex="#D6D3D1" className="bg-gray-300" />
                <Swatch label="400" hex="#A8A29E" className="bg-gray-400" />
                <Swatch label="500" hex="#78716C" className="bg-gray-500" />
                <Swatch label="600" hex="#57534E" className="bg-gray-600" />
                <Swatch label="700" hex="#44403C" className="bg-gray-700" />
                <Swatch label="800" hex="#292524" className="bg-gray-800" />
                <Swatch label="900" hex="#1C1917" className="bg-gray-900" />
                <Swatch label="950" hex="#0C0A09" className="bg-gray-950" />
              </div>
            </Sub>

            <Sub title="Semantic">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-success-600">Success</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Swatch label="100" hex="#DCFCE7" className="bg-success-100" />
                    <Swatch label="400" hex="#4ADE80" className="bg-success-400" />
                    <Swatch label="500" hex="#16A34A" className="bg-success-500" />
                    <Swatch label="600" hex="#15803D" className="bg-success-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-warning-600">Warning</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Swatch label="100" hex="#FEF9C3" className="bg-warning-100" />
                    <Swatch label="400" hex="#FACC15" className="bg-warning-400" />
                    <Swatch label="500" hex="#EAB308" className="bg-warning-500" />
                    <Swatch label="600" hex="#CA8A04" className="bg-warning-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-error-600">Error</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Swatch label="100" hex="#FEE2E2" className="bg-error-100" />
                    <Swatch label="400" hex="#F87171" className="bg-error-400" />
                    <Swatch label="500" hex="#EF4444" className="bg-error-500" />
                    <Swatch label="600" hex="#DC2626" className="bg-error-600" />
                  </div>
                </div>
              </div>
            </Sub>
          </Section>

          {/* ──────────── TYPOGRAPHY ──────────── */}
          <Section id="typography" title="Typography" description="Inter for UI, JetBrains Mono for data." alt>
            <DemoBox>
              <div className="space-y-5">
                {[
                  ["H1", "Page Title", "text-2xl font-bold tracking-tight", "24px / bold"],
                  ["H2", "Section Title", "text-lg font-bold", "18px / bold"],
                  ["H3", "Card Title", "text-sm font-semibold", "14px / 600"],
                  ["Body", "Regular paragraph content for descriptions", "text-sm", "14px / 400"],
                  ["Small", "Helper text, captions, and labels", "text-xs text-text-muted", "12px / 400"],
                  ["Mono", "SHP-2024-001 | 1,250.00", "text-sm font-mono", "14px / mono"],
                ].map(([label, example, cls, spec]) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 pb-4 border-b border-border-default last:border-0 last:pb-0">
                    <div className="flex items-baseline gap-4 min-w-0">
                      <span className="text-[11px] font-semibold text-text-muted w-10 shrink-0">{label}</span>
                      <span className={cls}>{example}</span>
                    </div>
                    <span className="text-[11px] text-text-muted font-mono shrink-0">{spec}</span>
                  </div>
                ))}
              </div>
            </DemoBox>
          </Section>

          {/* ──────────── SPACING ──────────── */}
          <Section id="spacing" title="Spacing & Radius" description="8pt grid system with two radius tiers.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <DemoBox>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Spacing Scale</h3>
                <div className="flex items-end gap-3">
                  {[4, 8, 12, 16, 24, 32, 40, 48].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <div className="bg-primary-200 rounded-sm" style={{ width: s, height: s }} />
                      <span className="text-[11px] text-text-muted font-mono">{s}</span>
                    </div>
                  ))}
                </div>
              </DemoBox>
              <DemoBox>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Border Radius</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-20 bg-gray-100 border border-border-strong rounded-[var(--radius-sm)]" />
                    <span className="text-[11px] text-text-muted">sm (8px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-20 bg-gray-100 border border-border-strong rounded-[var(--radius-lg)]" />
                    <span className="text-[11px] text-text-muted">lg (14px)</span>
                  </div>
                </div>
              </DemoBox>
            </div>
          </Section>

          {/* ──────────── BUTTONS ──────────── */}
          <Section id="buttons" title="Buttons & Actions" description="Primary actions, secondary actions, and icon buttons." alt>
            <DemoBox className="space-y-8">
              <Sub title="Variants">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                </div>
              </Sub>

              <Sub title="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </Sub>

              <Sub title="With Icons">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Item</Button>
                  <Button variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
                  <Button variant="secondary"><Download className="h-4 w-4" /> Export CSV</Button>
                </div>
              </Sub>

              <Sub title="States">
                <div className="flex flex-wrap items-center gap-3">
                  <Button loading>Saving...</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="secondary" loading>Loading</Button>
                </div>
              </Sub>

              <Sub title="Icon Buttons">
                <div className="flex flex-wrap items-center gap-2">
                  <IconButton label="Settings"><Settings className="h-4 w-4" /></IconButton>
                  <IconButton label="Search" size="sm"><Search className="h-4 w-4" /></IconButton>
                  <IconButton label="More"><MoreHorizontal className="h-4 w-4" /></IconButton>
                  <IconButton label="Notifications" variant="secondary"><Bell className="h-4 w-4" /></IconButton>
                </div>
              </Sub>
            </DemoBox>
          </Section>

          {/* ──────────── BADGES ──────────── */}
          <Section id="badges" title="Badges & Tags" description="Status indicators and categorical labels.">
            <DemoBox>
              <div className="flex flex-wrap gap-3">
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="error">Failed</Badge>
                <Badge variant="info">New</Badge>
              </div>
            </DemoBox>
          </Section>

          {/* ──────────── CARDS ──────────── */}
          <Section id="cards" title="Cards & Panels" description="Content containers with three visual tiers." alt>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default</CardTitle>
                  <CardDescription>Primary content container with border and shadow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-text-muted">Use for main content areas.</p>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Outlined</CardTitle>
                  <CardDescription>Strong border, no shadow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-text-muted">Use for grouped or secondary content.</p>
                </CardContent>
              </Card>
              <Card variant="subtle">
                <CardHeader>
                  <CardTitle>Subtle</CardTitle>
                  <CardDescription>Tinted background, no border.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-text-muted">Use for KPIs and summary widgets.</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* ──────────── HEADERS ──────────── */}
          <Section id="headers" title="Page & Section Headers" description="Consistent page-level and section-level headings.">
            <div className="space-y-4">
              <DemoBox>
                <PageHeader
                  title="Shipments"
                  subtitle="View and manage all waste shipments across sites"
                  actions={
                    <>
                      <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>
                      <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Shipment</Button>
                    </>
                  }
                />
              </DemoBox>
              <DemoBox>
                <SectionHeader
                  title="Recent Activity"
                  action={<Button variant="ghost" size="sm">View All</Button>}
                />
              </DemoBox>
            </div>
          </Section>

          {/* ──────────── FORMS ──────────── */}
          <Section id="forms" title="Form Inputs" description="All form controls with validation states." alt>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <DemoBox className="space-y-5">
                <Sub title="Text Input">
                  <div className="space-y-3">
                    <FormField label="Site Name" htmlFor="site-w" required>
                      <TextInput id="site-w" placeholder="Enter site name" />
                    </FormField>
                    <FormField label="Email" htmlFor="email-err-w" error="Please enter a valid email">
                      <TextInput id="email-err-w" placeholder="user@mps.com" error defaultValue="bad-email" />
                    </FormField>
                    <FormField label="Search">
                      <TextInput variant="search" placeholder="Search shipments..." />
                    </FormField>
                    <FormField label="Disabled">
                      <TextInput disabled defaultValue="Cannot edit" />
                    </FormField>
                  </div>
                </Sub>

                <Sub title="Number Input">
                  <div className="space-y-3">
                    <FormField label="Weight" htmlFor="weight-w">
                      <NumberInput id="weight-w" placeholder="0.00" suffix="lbs" />
                    </FormField>
                    <FormField label="Cost" htmlFor="cost-w">
                      <NumberInput id="cost-w" placeholder="0.00" prefix="$" />
                    </FormField>
                  </div>
                </Sub>

                <Sub title="Textarea">
                  <FormField label="Notes" helperText="Optional notes for this shipment">
                    <Textarea placeholder="Add any additional notes..." />
                  </FormField>
                </Sub>
              </DemoBox>

              <DemoBox className="space-y-5">
                <Sub title="Select">
                  <FormField label="Waste Type">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select waste type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hazardous">Hazardous</SelectItem>
                        <SelectItem value="non-hazardous">Non-Hazardous</SelectItem>
                        <SelectItem value="recyclable">Recyclable</SelectItem>
                        <SelectItem value="organic">Organic</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </Sub>

                <Sub title="Date Picker">
                  <FormField label="Shipment Date">
                    <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
                  </FormField>
                </Sub>

                <Sub title="Checkbox">
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox defaultChecked />
                      <span className="text-sm text-text-primary">Accept terms</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox />
                      <span className="text-sm text-text-primary">Subscribe to notifications</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-not-allowed">
                      <Checkbox disabled />
                      <span className="text-sm text-text-muted">Disabled option</span>
                    </label>
                  </div>
                </Sub>

                <Sub title="Radio Group">
                  <RadioGroup defaultValue="lbs">
                    {[
                      ["lbs", "Pounds (lbs)"],
                      ["tons", "Tons"],
                      ["kg", "Kilograms (kg)"],
                    ].map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2.5 cursor-pointer">
                        <RadioGroupItem value={val} />
                        <span className="text-sm text-text-primary">{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Sub>

                <Sub title="Switch">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">Email notifications</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">Auto-save drafts</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Disabled</span>
                      <Switch disabled />
                    </div>
                  </div>
                </Sub>
              </DemoBox>
            </div>
          </Section>

          {/* ──────────── FEEDBACK ──────────── */}
          <Section id="feedback" title="Feedback & Status" description="Alerts, toasts, progress indicators, and empty states.">
            <div className="space-y-6">
              <Sub title="Alert Banners">
                <div className="space-y-2">
                  <AlertBanner variant="info">New system maintenance scheduled for this weekend.</AlertBanner>
                  <AlertBanner variant="success">12 shipments successfully submitted.</AlertBanner>
                  <AlertBanner variant="warning">Export exceeds 50,000 rows. Performance may be affected.</AlertBanner>
                  <AlertBanner variant="error">3 rows failed validation. Please review errors below.</AlertBanner>
                </div>
              </Sub>

              <Sub title="Toast Notifications">
                <DemoBox>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toast.success("Submitted", { description: "42 rows inserted." })}>Success</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.error("Failed", { description: "3 rows had errors." })}>Error</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.warning("Large export", { description: "May take a moment." })}>Warning</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.info("Export started", { description: "Download begins shortly." })}>Info</Button>
                  </div>
                </DemoBox>
              </Sub>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <DemoBox>
                  <Sub title="Progress Bar">
                    <div className="space-y-4">
                      {[
                        ["Uploading...", 25],
                        ["Processing...", 60],
                        ["Complete", 100],
                      ].map(([label, val]) => (
                        <div key={label as string} className="space-y-1.5">
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>{label}</span>
                            <span>{val}%</span>
                          </div>
                          <ProgressBar value={val as number} />
                        </div>
                      ))}
                    </div>
                  </Sub>
                </DemoBox>

                <DemoBox>
                  <Sub title="Spinners & Skeletons">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex flex-col items-center gap-1.5">
                        <Spinner size="sm" />
                        <span className="text-[11px] text-text-muted">sm</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <Spinner size="md" />
                        <span className="text-[11px] text-text-muted">md</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <Spinner size="lg" />
                        <span className="text-[11px] text-text-muted">lg</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </Sub>
                </DemoBox>
              </div>

              <DemoBox>
                <EmptyState
                  icon={<Inbox className="h-10 w-10" />}
                  title="No shipments yet"
                  description="Get started by creating your first waste shipment entry."
                  action={<Button size="sm"><Plus className="h-3.5 w-3.5" /> New Shipment</Button>}
                />
              </DemoBox>
            </div>
          </Section>

          {/* ──────────── OVERLAYS ──────────── */}
          <Section id="overlays" title="Overlays" description="Dialogs, drawers, tooltips, popovers, and menus." alt>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <DemoBox className="space-y-5">
                <Sub title="Dialog">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Shipment</DialogTitle>
                        <DialogDescription>Make changes to the shipment record.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-4">
                        <FormField label="Site Name">
                          <TextInput defaultValue="Site Alpha" />
                        </FormField>
                        <FormField label="Weight">
                          <NumberInput defaultValue={1250} suffix="lbs" />
                        </FormField>
                      </div>
                      <DialogFooter>
                        <Button variant="secondary" size="sm">Cancel</Button>
                        <Button size="sm">Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Sub>

                <Sub title="Drawer">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="secondary" size="sm">Open Drawer</Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Shipment Details</DrawerTitle>
                        <DrawerDescription>SHP-2024-001</DrawerDescription>
                      </DrawerHeader>
                      <DrawerBody className="space-y-3">
                        {[
                          ["Date", "Jan 15, 2024"],
                          ["Vendor", "Clean Haulers Inc."],
                          ["Waste Type", "Non-Hazardous"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm py-2 border-b border-border-default last:border-0">
                            <span className="text-text-muted">{k}</span>
                            <span className="text-text-primary font-medium">{v}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm py-2 border-b border-border-default">
                          <span className="text-text-muted">Weight</span>
                          <span className="text-text-primary font-mono font-medium">1,250 lbs</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 items-center">
                          <span className="text-text-muted">Status</span>
                          <Badge variant="success">Active</Badge>
                        </div>
                      </DrawerBody>
                      <DrawerFooter>
                        <Button variant="secondary" size="sm">Edit</Button>
                        <Button size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                </Sub>

                <Sub title="Confirm Dialog">
                  <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    trigger={<Button variant="destructive" size="sm">Delete Record</Button>}
                    title="Delete this shipment?"
                    description="This action cannot be undone."
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={() => toast.success("Record deleted")}
                  />
                </Sub>
              </DemoBox>

              <DemoBox className="space-y-5">
                <Sub title="Tooltip">
                  <div className="flex gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" size="sm">Hover me</Button>
                      </TooltipTrigger>
                      <TooltipContent>This is a tooltip</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton label="Settings" size="sm"><Settings className="h-4 w-4" /></IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Manage settings</TooltipContent>
                    </Tooltip>
                  </div>
                </Sub>

                <Sub title="Popover">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="secondary" size="sm">Open Popover</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Filter Options</h4>
                      <FormField label="Min weight">
                        <NumberInput placeholder="0" suffix="lbs" />
                      </FormField>
                    </PopoverContent>
                  </Popover>
                </Sub>

                <Sub title="Dropdown Menu">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
                        Actions <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem><Share2 className="h-3.5 w-3.5" /> Share</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Sub>
              </DemoBox>
            </div>
          </Section>

          {/* ──────────── NAVIGATION ──────────── */}
          <Section id="navigation" title="Navigation" description="Tabs, breadcrumbs, and pagination.">
            <DemoBox className="space-y-8">
              <Sub title="Tabs">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="shipments">Shipments</TabsTrigger>
                    <TabsTrigger value="exports">Exports</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <p className="text-sm text-text-muted py-4">Dashboard overview content with KPI cards and recent activity.</p>
                  </TabsContent>
                  <TabsContent value="shipments">
                    <p className="text-sm text-text-muted py-4">Shipment list with filters, sorting, and pagination.</p>
                  </TabsContent>
                  <TabsContent value="exports">
                    <p className="text-sm text-text-muted py-4">Export history and scheduled exports.</p>
                  </TabsContent>
                  <TabsContent value="settings">
                    <p className="text-sm text-text-muted py-4">Application settings and preferences.</p>
                  </TabsContent>
                </Tabs>
              </Sub>

              <Sub title="Breadcrumbs">
                <div className="space-y-3">
                  <Breadcrumbs
                    items={[
                      { label: "Home", href: "/" },
                      { label: "Shipments", href: "/shipments" },
                      { label: "SHP-2024-001" },
                    ]}
                  />
                  <Breadcrumbs
                    items={[
                      { label: "Admin", href: "/admin" },
                      { label: "Lookup Tables", href: "/admin/lookups" },
                      { label: "Vendors", href: "/admin/lookups/vendors" },
                      { label: "Edit Vendor" },
                    ]}
                  />
                </div>
              </Sub>

              <Sub title="Pagination">
                <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />
              </Sub>
            </DemoBox>
          </Section>

          {/* Footer */}
          <div className="py-10 text-center">
            <p className="text-xs text-text-muted">
              MPS Design System v1.0 &middot; Warm Theme &middot; Radix UI + Tailwind v4 + Motion
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
