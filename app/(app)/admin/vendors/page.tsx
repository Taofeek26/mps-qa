"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
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
import { vendorsApi } from "@/lib/api-client";
import { useVendors } from "@/lib/hooks/use-api-data";
import type { Vendor, VendorRiskLevel, VendorCompletionStatus, VendorQualStatus } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const VENDOR_TYPES = ["Hauler", "Processor", "Disposal", "Recycler"];
const RISK_LEVELS: VendorRiskLevel[] = ["Level 1 - High", "Level 2 - Medium", "Level 3 - Low"];
const QUAL_STATUSES = ["Active", "Temporary", "Inactive"];
const COMPLETION_STATUSES: VendorCompletionStatus[] = ["Complete", "Incomplete"];

const vendorTypeBadge: Record<string, BadgeVariant> = {
  Hauler: "info",
  Processor: "warning",
  Disposal: "error",
  Recycler: "success",
};

const riskLevelBadge: Record<string, BadgeVariant> = {
  "Level 1 - High": "error",
  "Level 2 - Medium": "warning",
  "Level 3 - Low": "success",
};

const completionBadge: Record<string, BadgeVariant> = {
  Complete: "success",
  Incomplete: "warning",
};

function formatDateCell(dateStr: string | undefined) {
  if (!dateStr) return <span className="text-text-muted">—</span>;
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const formatted = format(date, "MMM d, yyyy");

  if (diffDays < 0) {
    return <span className="text-error-500">{formatted}</span>;
  }
  if (diffDays <= 90) {
    return <span className="text-warning-500">{formatted}</span>;
  }
  return <span className="text-text-secondary">{formatted}</span>;
}

/* ─── Columns ─── */

const columns: ColumnDef<Vendor, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 220,
  },
  {
    accessorKey: "vendorType",
    header: "Type",
    size: 110,
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <Badge variant={vendorTypeBadge[type] ?? "neutral"}>{type}</Badge>
      );
    },
  },
  {
    accessorKey: "city",
    header: "City",
    size: 140,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    size: 80,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    size: 130,
    cell: ({ getValue }) => {
      const level = getValue() as string | undefined;
      if (!level) return <span className="text-text-muted">—</span>;
      return <Badge variant={riskLevelBadge[level] ?? "neutral"}>{level}</Badge>;
    },
  },
  {
    accessorKey: "completionStatus",
    header: "Completion",
    size: 110,
    cell: ({ getValue }) => {
      const status = getValue() as string | undefined;
      if (!status) return <span className="text-text-muted">—</span>;
      return <Badge variant={completionBadge[status] ?? "neutral"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "expirationDate",
    header: "Expiration",
    size: 120,
    cell: ({ getValue }) => formatDateCell(getValue() as string | undefined),
  },
  {
    accessorKey: "dbeFlag",
    header: "DBE",
    size: 60,
    cell: ({ getValue }) => {
      const dbe = getValue() as boolean | undefined;
      return dbe ? <Badge variant="info">Yes</Badge> : <span className="text-text-muted">—</span>;
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    size: 100,
    cell: ({ getValue }) => {
      const active = getValue() as boolean;
      return (
        <Badge variant={active ? "success" : "neutral"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

/* ─── Form ─── */

function VendorForm({
  item,
  onClose,
  onSaved,
}: {
  item: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [vendorType, setVendorType] = React.useState(item?.vendorType ?? "");
  const [city, setCity] = React.useState(item?.city ?? "");
  const [state, setState] = React.useState(item?.state ?? "");
  const [phone, setPhone] = React.useState(item?.phone ?? "");
  const [active, setActive] = React.useState(item?.active ?? true);
  const [dbe, setDbe] = React.useState(item?.dbeFlag ?? false);
  const [riskLevel, setRiskLevel] = React.useState(item?.riskLevel ?? "");
  const [qualificationStatus, setQualificationStatus] = React.useState(item?.vendorStatus ?? "");
  const [completionStatus, setCompletionStatus] = React.useState(item?.completionStatus ?? "");
  const [commodity1, setCommodity1] = React.useState(item?.commodities?.[0] ?? "");
  const [commodity2, setCommodity2] = React.useState(item?.commodities?.[1] ?? "");
  const [supplierForm, setSupplierForm] = React.useState(item?.supplierForm ?? "");
  const [dateEntered, setDateEntered] = React.useState(item?.dateEntered ?? "");
  const [dateReviewed, setDateReviewed] = React.useState(item?.dateReviewed ?? "");
  const [expirationDate, setExpirationDate] = React.useState(item?.expirationDate ?? "");
  const [reviewedBy, setReviewedBy] = React.useState(item?.reviewedBy ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!vendorType) errs.vendorType = "Type is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const commodities = [commodity1, commodity2].filter(Boolean);
    const data = {
      vendor_name: name.trim(),
      vendor_type: vendorType,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      phone: phone.trim() || undefined,
      is_active: active,
      dbe_flag: dbe,
      risk_level: (riskLevel || undefined) as VendorRiskLevel | undefined,
      vendor_status: (qualificationStatus || undefined) as VendorQualStatus | undefined,
      completion_status: (completionStatus || undefined) as VendorCompletionStatus | undefined,
      commodities: commodities.length > 0 ? commodities : undefined,
      supplier_form: supplierForm.trim() || undefined,
      date_entered: dateEntered || undefined,
      date_reviewed: dateReviewed || undefined,
      expiration_date: expirationDate || undefined,
      reviewed_by: reviewedBy.trim() || undefined,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await vendorsApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Vendor updated");
      } else {
        const result = await vendorsApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Vendor created");
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
      <FormField label="Name" required error={errors.name}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Clean Earth Solutions"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Type" required error={errors.vendorType}>
        <Select value={vendorType} onValueChange={setVendorType}>
          <SelectTrigger error={!!errors.vendorType}>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {VENDOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City">
          <TextInput
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </FormField>
        <FormField label="State">
          <TextInput
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
          />
        </FormField>
      </div>

      <FormField label="Phone">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </FormField>

      <div className="border-t border-border-default pt-4 mt-2">
        <p className="text-sm font-medium text-text-primary mb-3">Qualification Details</p>
      </div>

      <FormField label="DBE">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={dbe} onCheckedChange={setDbe} />
          <span className="text-sm text-text-secondary">
            {dbe ? "Yes" : "No"}
          </span>
        </div>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Risk Level">
          <Select value={riskLevel} onValueChange={setRiskLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select risk level..." />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Qualification Status">
          <Select value={qualificationStatus} onValueChange={setQualificationStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {QUAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Completion Status">
        <Select value={completionStatus} onValueChange={setCompletionStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select completion..." />
          </SelectTrigger>
          <SelectContent>
            {COMPLETION_STATUSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Commodity 1">
          <TextInput
            value={commodity1}
            onChange={(e) => setCommodity1(e.target.value)}
            placeholder="e.g. Used Oil"
          />
        </FormField>
        <FormField label="Commodity 2">
          <TextInput
            value={commodity2}
            onChange={(e) => setCommodity2(e.target.value)}
            placeholder="e.g. Solvents"
          />
        </FormField>
      </div>

      <FormField label="Supplier Form">
        <TextInput
          value={supplierForm}
          onChange={(e) => setSupplierForm(e.target.value)}
          placeholder="e.g. SF-2024-001"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Date Entered">
          <DatePicker
            value={dateEntered ? new Date(dateEntered + "T00:00:00") : undefined}
            onChange={(date) => setDateEntered(date ? format(date, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
        <FormField label="Date Reviewed">
          <DatePicker
            value={dateReviewed ? new Date(dateReviewed + "T00:00:00") : undefined}
            onChange={(date) => setDateReviewed(date ? format(date, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
        <FormField label="Expiration Date">
          <DatePicker
            value={expirationDate ? new Date(expirationDate + "T00:00:00") : undefined}
            onChange={(date) => setExpirationDate(date ? format(date, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
      </div>

      <FormField label="Reviewed By">
        <TextInput
          value={reviewedBy}
          onChange={(e) => setReviewedBy(e.target.value)}
          placeholder="e.g. John Smith"
        />
      </FormField>

      <FormField label="Active">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-sm text-text-secondary">
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Vendor"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */


export default function VendorsPage() {
  return (
    <React.Suspense fallback={null}>
      <VendorsContent />
    </React.Suspense>
  );
}

function VendorsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("");

  // Fetch vendors from API
  const { vendors: allData, loading, refetch } = useVendors();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.city?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter) {
      result = result.filter((v) => v.vendorType === typeFilter);
    }
    if (statusFilter) {
      result = result.filter((v) =>
        statusFilter === "active" ? v.active : !v.active
      );
    }
    if (riskFilter) {
      result = result.filter((v) => v.riskLevel === riskFilter);
    }
    return result;
  }, [allData, search, typeFilter, statusFilter, riskFilter]);

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

  function refresh() {
    refetch();
  }

  async function handleDelete(item: Vendor) {
    try {
      const result = await vendorsApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Vendor deleted");
      refetch();
    } catch {
      toast.error("Failed to delete vendor");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleTypeChange(value: string) {
    setTypeFilter(value);
    resetPage();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    resetPage();
  }

  function handleRiskChange(value: string) {
    setRiskFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setRiskFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<Vendor>
      title="Vendors"
      subtitle={`${filtered.length} vendors`}
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
      searchPlaceholder="Search vendors..."
      onResetFilters={resetFilters}
      filterSlots={
        <>
          <div className="w-full sm:w-40">
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-36">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-44">
            <Select value={riskFilter} onValueChange={handleRiskChange}>
              <SelectTrigger>
                <SelectValue placeholder="All risk levels" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      entityName="Vendor"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<Building2 className="h-10 w-10" />}
      emptyTitle="No vendors found"
      emptyDescription="Add your first vendor to get started."
      loading={loading}
      formContent={({ item, onClose }) => (
        <VendorForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
    </div>
  );
}
