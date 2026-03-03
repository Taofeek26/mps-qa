"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
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
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "@/lib/mock-data";
import type { Vendor } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const VENDOR_TYPES = ["Hauler", "Processor", "Disposal", "Recycler"];

const vendorTypeBadge: Record<string, BadgeVariant> = {
  Hauler: "info",
  Processor: "warning",
  Disposal: "error",
  Recycler: "success",
};

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
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!vendorType) errs.vendorType = "Type is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: name.trim(),
      vendorType,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      phone: phone.trim() || undefined,
      active,
    };

    if (item) {
      updateVendor(item.id, data);
      toast.success("Vendor updated");
    } else {
      createVendor(data);
      toast.success("Vendor created");
    }

    onSaved();
    onClose();
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

      <FormField label="Active">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-sm text-text-secondary">
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {item ? "Save Changes" : "Create Vendor"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

const PAGE_SIZE = 10;

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

  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const allData = React.useMemo(() => getVendors(), [refreshKey]);

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
    return result;
  }, [allData, search, typeFilter, statusFilter]);

  /* ─── Pagination ─── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedData = React.useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
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
    setRefreshKey((k) => k + 1);
  }

  function handleDelete(item: Vendor) {
    deleteVendor(item.id);
    toast.success("Vendor deleted");
    refresh();
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

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    router.replace(pathname);
  }

  return (
    <CrudTable<Vendor>
      title="Vendors"
      subtitle={`${filtered.length} vendors`}
      columns={columns}
      data={paginatedData}
      pagination={{
        page: safePage,
        pageSize: PAGE_SIZE,
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
        </>
      }
      entityName="Vendor"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<Building2 className="h-10 w-10" />}
      emptyTitle="No vendors found"
      emptyDescription="Add your first vendor to get started."
      formContent={({ item, onClose }) => (
        <VendorForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
  );
}
