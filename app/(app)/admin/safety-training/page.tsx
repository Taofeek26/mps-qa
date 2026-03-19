"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import { safetyTrainingApi } from "@/lib/api-client";
import { useSafetyTrainingRecords, type SafetyTrainingRecordEntity } from "@/lib/hooks/use-api-data";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/* ─── Columns ─── */

const columns: ColumnDef<SafetyTrainingRecordEntity, unknown>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee",
    size: 180,
  },
  {
    accessorKey: "department",
    header: "Department",
    size: 140,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "courseName",
    header: "Course",
    size: 200,
  },
  {
    accessorKey: "completionDate",
    header: "Completed",
    size: 120,
    cell: ({ getValue }) => {
      const dateStr = getValue() as string;
      if (!dateStr) return <span className="text-text-muted">—</span>;
      return format(new Date(dateStr), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "expirationDate",
    header: "Expires",
    size: 120,
    cell: ({ getValue }) => {
      const dateStr = getValue() as string;
      if (!dateStr) return <span className="text-text-muted">—</span>;
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const formatted = format(date, "MMM d, yyyy");

      if (diffDays < 0) {
        return <span className="text-error-500">{formatted}</span>;
      }
      if (diffDays <= 30) {
        return <span className="text-warning-500">{formatted}</span>;
      }
      return <span className="text-text-secondary">{formatted}</span>;
    },
  },
  {
    accessorKey: "certified",
    header: "Certified",
    size: 100,
    cell: ({ getValue }) => {
      const certified = getValue() as boolean;
      return (
        <Badge variant={certified ? "success" : "warning"}>
          {certified ? "Yes" : "No"}
        </Badge>
      );
    },
  },
];

/* ─── Form ─── */

function SafetyTrainingForm({
  item,
  onClose,
  onSaved,
}: {
  item: SafetyTrainingRecordEntity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [employeeName, setEmployeeName] = React.useState(item?.employeeName ?? "");
  const [department, setDepartment] = React.useState(item?.department ?? "");
  const [courseName, setCourseName] = React.useState(item?.courseName ?? "");
  const [completionDate, setCompletionDate] = React.useState(item?.completionDate ?? "");
  const [expirationDate, setExpirationDate] = React.useState(item?.expirationDate ?? "");
  const [certified, setCertified] = React.useState(item?.certified ?? false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!employeeName.trim()) errs.employeeName = "Employee name is required";
    if (!department.trim()) errs.department = "Department is required";
    if (!courseName.trim()) errs.courseName = "Course name is required";
    if (!completionDate) errs.completionDate = "Completion date is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      employee_name: employeeName.trim(),
      department: department.trim(),
      course_name: courseName.trim(),
      completion_date: completionDate,
      expiration_date: expirationDate || undefined,
      certified,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await safetyTrainingApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Training record updated");
      } else {
        const result = await safetyTrainingApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Training record created");
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
      <FormField label="Employee Name" required error={errors.employeeName}>
        <TextInput
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          placeholder="Enter employee name"
          error={!!errors.employeeName}
        />
      </FormField>

      <FormField label="Department" required error={errors.department}>
        <TextInput
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Operations, Safety, Logistics"
          error={!!errors.department}
        />
      </FormField>

      <FormField label="Course Name" required error={errors.courseName}>
        <TextInput
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g. Hazmat Handling, Forklift Certification"
          error={!!errors.courseName}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Completion Date" required error={errors.completionDate}>
          <DatePicker
            value={completionDate ? new Date(completionDate + "T00:00:00") : undefined}
            onChange={(d) => setCompletionDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
        <FormField label="Expiration Date">
          <DatePicker
            value={expirationDate ? new Date(expirationDate + "T00:00:00") : undefined}
            onChange={(d) => setExpirationDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date (optional)"
          />
        </FormField>
      </div>

      <FormField label="Certified">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={certified} onCheckedChange={setCertified} />
          <span className="text-sm text-text-secondary">
            {certified ? "Employee is certified" : "Not yet certified"}
          </span>
        </div>
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

export default function SafetyTrainingPage() {
  return (
    <React.Suspense fallback={null}>
      <SafetyTrainingContent />
    </React.Suspense>
  );
}

function SafetyTrainingContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [certifiedFilter, setCertifiedFilter] = React.useState("");

  // Fetch data from API
  const { safetyTrainingRecords: allData, loading, refetch } = useSafetyTrainingRecords();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.employeeName?.toLowerCase().includes(q) ||
          v.department?.toLowerCase().includes(q) ||
          v.courseName?.toLowerCase().includes(q)
      );
    }
    if (certifiedFilter) {
      result = result.filter((v) =>
        certifiedFilter === "certified" ? v.certified : !v.certified
      );
    }
    return result;
  }, [allData, search, certifiedFilter]);

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

  async function handleDelete(item: SafetyTrainingRecordEntity) {
    try {
      const result = await safetyTrainingApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Training record deleted");
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
    setCertifiedFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
      <CrudTable<SafetyTrainingRecordEntity>
        title="Safety Training Records"
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
        searchPlaceholder="Search training records..."
        onResetFilters={resetFilters}
        filterSlots={
          <div className="w-full sm:w-40">
            <select
              className="w-full h-9 px-3 text-sm rounded-md border border-border-default bg-bg-primary"
              value={certifiedFilter}
              onChange={(e) => { setCertifiedFilter(e.target.value); resetPage(); }}
            >
              <option value="">All statuses</option>
              <option value="certified">Certified</option>
              <option value="not-certified">Not Certified</option>
            </select>
          </div>
        }
        entityName="Record"
        getItemLabel={(item) => `${item.employeeName} - ${item.courseName}`}
        onDelete={handleDelete}
        emptyIcon={<GraduationCap className="h-10 w-10" />}
        emptyTitle="No training records"
        emptyDescription="No safety training records yet. Add a new record to track employee training."
        loading={loading}
        formContent={({ item, onClose }) => (
          <SafetyTrainingForm
            item={item}
            onClose={onClose}
            onSaved={refetch}
          />
        )}
      />
    </div>
  );
}
