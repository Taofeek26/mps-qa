"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";
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
import { inspectionRecordsApi } from "@/lib/api-client";
import { useInspectionRecords, useSites } from "@/lib/hooks/use-api-data";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const INSPECTION_TYPES = ["pre-trip", "post-trip", "annual", "quarterly", "DOT"];

const typeBadge: Record<string, BadgeVariant> = {
  "pre-trip": "info",
  "post-trip": "info",
  annual: "warning",
  quarterly: "neutral",
  DOT: "error",
};

interface InspectionRecordRow {
  id: string;
  siteId: string;
  siteName: string;
  date: string;
  passed: boolean;
  findings: number;
  inspectorName: string;
}

/* ─── Columns ─── */

const columns: ColumnDef<InspectionRecordRow, unknown>[] = [
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
    accessorKey: "siteName",
    header: "Site",
    size: 180,
  },
  {
    accessorKey: "inspectorName",
    header: "Inspector",
    size: 150,
    cell: ({ getValue }) => {
      const name = getValue() as string;
      return <span className="text-text-secondary">{name || "—"}</span>;
    },
  },
  {
    accessorKey: "findings",
    header: "Findings",
    size: 100,
    cell: ({ getValue }) => {
      const findings = getValue() as number;
      return (
        <Badge variant={findings === 0 ? "success" : findings < 3 ? "warning" : "error"}>
          {findings}
        </Badge>
      );
    },
  },
  {
    accessorKey: "passed",
    header: "Result",
    size: 100,
    cell: ({ getValue }) => {
      const passed = getValue() as boolean;
      return (
        <Badge variant={passed ? "success" : "error"}>
          {passed ? "Passed" : "Failed"}
        </Badge>
      );
    },
  },
];

/* ─── Form ─── */

function InspectionRecordForm({
  item,
  onClose,
  onSaved,
  sites,
}: {
  item: InspectionRecordRow | null;
  onClose: () => void;
  onSaved: () => void;
  sites: { id: string; name: string }[];
}) {
  const [siteId, setSiteId] = React.useState(item?.siteId ?? "");
  const [inspectionDate, setInspectionDate] = React.useState(item?.date ?? "");
  const [inspectionType, setInspectionType] = React.useState("");
  const [inspectorName, setInspectorName] = React.useState(item?.inspectorName ?? "");
  const [inspectorId, setInspectorId] = React.useState("");
  const [passed, setPassed] = React.useState(item?.passed ?? true);
  const [findings, setFindings] = React.useState(String(item?.findings ?? 0));
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!siteId) errs.siteId = "Site is required";
    if (!inspectionDate) errs.inspectionDate = "Date is required";
    if (!inspectorName.trim()) errs.inspectorName = "Inspector name is required";
    const findingsNum = parseInt(findings, 10);
    if (isNaN(findingsNum) || findingsNum < 0) errs.findings = "Findings must be a non-negative number";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      site_id: siteId,
      inspection_date: inspectionDate,
      inspection_type: inspectionType || undefined,
      inspector_name: inspectorName.trim(),
      inspector_id: inspectorId.trim() || undefined,
      passed,
      findings: findingsNum,
      notes: notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await inspectionRecordsApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Inspection record updated");
      } else {
        const result = await inspectionRecordsApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Inspection record created");
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
        <FormField label="Inspection Date" required error={errors.inspectionDate}>
          <DatePicker
            value={inspectionDate ? new Date(inspectionDate + "T00:00:00") : undefined}
            onChange={(d) => setInspectionDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Inspection Type">
          <Select value={inspectionType} onValueChange={setInspectionType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {INSPECTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Inspector Name" required error={errors.inspectorName}>
          <TextInput
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder="Enter inspector name"
            error={!!errors.inspectorName}
          />
        </FormField>
      </div>

      <FormField label="Inspector ID">
        <TextInput
          value={inspectorId}
          onChange={(e) => setInspectorId(e.target.value)}
          placeholder="Optional inspector ID"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Passed">
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={passed} onCheckedChange={setPassed} />
            <span className="text-sm text-text-secondary">
              {passed ? "Passed" : "Failed"}
            </span>
          </div>
        </FormField>
        <FormField label="Findings Count" required error={errors.findings}>
          <TextInput
            type="number"
            min="0"
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="0"
            error={!!errors.findings}
          />
        </FormField>
      </div>

      <FormField label="Notes">
        <TextInput
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Record"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function InspectionRecordsPage() {
  return (
    <React.Suspense fallback={null}>
      <InspectionRecordsContent />
    </React.Suspense>
  );
}

function InspectionRecordsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [resultFilter, setResultFilter] = React.useState("");

  // Fetch data from API
  const { inspectionRecords: allData, loading, refetch } = useInspectionRecords();
  const { sites } = useSites();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.siteName?.toLowerCase().includes(q) ||
          v.inspectorName?.toLowerCase().includes(q)
      );
    }
    if (resultFilter) {
      result = result.filter((v) =>
        resultFilter === "passed" ? v.passed : !v.passed
      );
    }
    return result;
  }, [allData, search, resultFilter]);

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

  async function handleDelete(item: InspectionRecordRow) {
    try {
      const result = await inspectionRecordsApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Inspection record deleted");
      refetch();
    } catch {
      toast.error("Failed to delete record");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setResultFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
      <CrudTable<InspectionRecordRow>
        title="Inspection Records"
        subtitle={`${filtered.length} records`}
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
        searchPlaceholder="Search inspections..."
        onResetFilters={resetFilters}
        filterSlots={
          <div className="w-full sm:w-36">
            <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); resetPage(); }}>
              <SelectTrigger>
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        entityName="Record"
        getItemLabel={(item) => `${item.siteName} - ${item.date}`}
        onDelete={handleDelete}
        emptyIcon={<ClipboardCheck className="h-10 w-10" />}
        emptyTitle="No inspection records"
        emptyDescription="No inspections recorded yet. Add a new record to track inspections."
        loading={loading}
        formContent={({ item, onClose }) => (
          <InspectionRecordForm
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
