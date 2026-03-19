"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import { safetyIncidentsApi } from "@/lib/api-client";
import { useSafetyIncidents, useSites } from "@/lib/hooks/use-api-data";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const INCIDENT_TYPES = ["vehicle", "chemical", "slip-fall", "equipment", "ergonomic"];
const SEVERITIES = ["minor", "moderate", "serious"];

const typeBadge: Record<string, BadgeVariant> = {
  vehicle: "info",
  chemical: "warning",
  "slip-fall": "error",
  equipment: "neutral",
  ergonomic: "success",
};

const severityBadge: Record<string, BadgeVariant> = {
  minor: "success",
  moderate: "warning",
  serious: "error",
};

interface SafetyIncidentRow {
  id: string;
  date: string;
  type: string;
  severity: string;
  resolved: boolean;
  siteId: string;
  description: string;
}

/* ─── Columns ─── */

const columns: ColumnDef<SafetyIncidentRow, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
    size: 120,
    cell: ({ getValue }) => {
      const dateStr = getValue() as string;
      if (!dateStr) return <span className="text-text-muted">—</span>;
      return format(new Date(dateStr), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    size: 120,
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return <Badge variant={typeBadge[type] ?? "neutral"}>{type}</Badge>;
    },
  },
  {
    accessorKey: "severity",
    header: "Severity",
    size: 100,
    cell: ({ getValue }) => {
      const severity = getValue() as string;
      return <Badge variant={severityBadge[severity] ?? "neutral"}>{severity}</Badge>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 300,
    cell: ({ getValue }) => {
      const desc = getValue() as string;
      return (
        <span className="text-text-secondary truncate block max-w-[280px]">
          {desc || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "resolved",
    header: "Status",
    size: 100,
    cell: ({ getValue }) => {
      const resolved = getValue() as boolean;
      return (
        <Badge variant={resolved ? "success" : "warning"}>
          {resolved ? "Resolved" : "Open"}
        </Badge>
      );
    },
  },
];

/* ─── Form ─── */

function SafetyIncidentForm({
  item,
  onClose,
  onSaved,
  sites,
}: {
  item: SafetyIncidentRow | null;
  onClose: () => void;
  onSaved: () => void;
  sites: { id: string; name: string }[];
}) {
  const [date, setDate] = React.useState(item?.date ?? "");
  const [type, setType] = React.useState(item?.type ?? "");
  const [severity, setSeverity] = React.useState(item?.severity ?? "");
  const [siteId, setSiteId] = React.useState(item?.siteId ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [resolved, setResolved] = React.useState(item?.resolved ?? false);
  const [resolvedDate, setResolvedDate] = React.useState("");
  const [rootCause, setRootCause] = React.useState("");
  const [correctiveAction, setCorrectiveAction] = React.useState("");
  const [reportedBy, setReportedBy] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Date is required";
    if (!type) errs.type = "Type is required";
    if (!severity) errs.severity = "Severity is required";
    if (!siteId) errs.siteId = "Site is required";
    if (!description.trim()) errs.description = "Description is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      date,
      type,
      severity,
      site_id: siteId,
      description: description.trim(),
      resolved,
      resolved_date: resolved && resolvedDate ? resolvedDate : undefined,
      root_cause: rootCause.trim() || undefined,
      corrective_action: correctiveAction.trim() || undefined,
      reported_by: reportedBy.trim() || undefined,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await safetyIncidentsApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Safety incident updated");
      } else {
        const result = await safetyIncidentsApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Safety incident created");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date" required error={errors.date}>
          <DatePicker
            value={date ? new Date(date + "T00:00:00") : undefined}
            onChange={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
        <FormField label="Site" required error={errors.siteId}>
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger error={!!errors.siteId}>
              <SelectValue placeholder="Select site..." />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" required error={errors.type}>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger error={!!errors.type}>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Severity" required error={errors.severity}>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger error={!!errors.severity}>
              <SelectValue placeholder="Select severity..." />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Description" required error={errors.description}>
        <TextInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the incident..."
          error={!!errors.description}
        />
      </FormField>

      <FormField label="Reported By">
        <TextInput
          value={reportedBy}
          onChange={(e) => setReportedBy(e.target.value)}
          placeholder="Name of reporter"
        />
      </FormField>

      <div className="border-t border-border-default pt-4 mt-2">
        <p className="text-sm font-medium text-text-primary mb-3">Resolution Details</p>
      </div>

      <FormField label="Resolved">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={resolved} onCheckedChange={setResolved} />
          <span className="text-sm text-text-secondary">
            {resolved ? "Yes" : "No"}
          </span>
        </div>
      </FormField>

      {resolved && (
        <FormField label="Resolved Date">
          <DatePicker
            value={resolvedDate ? new Date(resolvedDate + "T00:00:00") : undefined}
            onChange={(d) => setResolvedDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
      )}

      <FormField label="Root Cause">
        <TextInput
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="Describe root cause..."
        />
      </FormField>

      <FormField label="Corrective Action">
        <TextInput
          value={correctiveAction}
          onChange={(e) => setCorrectiveAction(e.target.value)}
          placeholder="Describe corrective action..."
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Incident"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function SafetyIncidentsPage() {
  return (
    <React.Suspense fallback={null}>
      <SafetyIncidentsContent />
    </React.Suspense>
  );
}

function SafetyIncidentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Fetch data from API
  const { safetyIncidents: allData, loading, refetch } = useSafetyIncidents();
  const { sites } = useSites();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.description?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      result = result.filter((v) => v.type === typeFilter);
    }
    if (severityFilter) {
      result = result.filter((v) => v.severity === severityFilter);
    }
    if (statusFilter) {
      result = result.filter((v) =>
        statusFilter === "resolved" ? v.resolved : !v.resolved
      );
    }
    return result;
  }, [allData, search, typeFilter, severityFilter, statusFilter]);

  /* ─── Pagination ─── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedData = React.useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  function pushPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function resetPage() {
    if (page <= 1) return;
    router.replace(pathname);
  }

  async function handleDelete(item: SafetyIncidentRow) {
    try {
      const result = await safetyIncidentsApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Safety incident deleted");
      refetch();
    } catch {
      toast.error("Failed to delete incident");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setSeverityFilter("");
    setStatusFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
      <CrudTable<SafetyIncidentRow>
        title="Safety Incidents"
        subtitle={`${filtered.length} incidents`}
        columns={columns}
        data={paginatedData}
        pagination={{
          page: safePage,
          pageSize: pageSize,
          total: filtered.length,
        }}
        onPaginationChange={pushPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search incidents..."
        onResetFilters={resetFilters}
        filterSlots={
          <>
            <div className="w-full sm:w-36">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
        entityName="Incident"
        getItemLabel={(item) => `${item.type} - ${item.date}`}
        onDelete={handleDelete}
        emptyIcon={<AlertTriangle className="h-10 w-10" />}
        emptyTitle="No safety incidents"
        emptyDescription="No incidents recorded. Add a new incident to track safety events."
        loading={loading}
        formContent={({ item, onClose }) => (
          <SafetyIncidentForm
            item={item}
            onClose={onClose}
            onSaved={refetch}
            sites={sites}
          />
        )}
      />
    </div>
  );
}
