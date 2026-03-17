"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useTransporters, useVendors } from "@/lib/hooks/use-api-data";
import { transportersApi } from "@/lib/api-client";
import type { Transporter, Vendor } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/* ─── Columns ─── */

function makeColumns(vendors: Vendor[]): ColumnDef<Transporter, unknown>[] {
  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

  return [
    {
      accessorKey: "transporterName",
      header: "Name",
      size: 220,
    },
    {
      accessorKey: "vendorId",
      header: "Linked Vendor",
      size: 200,
      cell: ({ getValue }) => {
        const vendorId = getValue() as string | undefined;
        const vendorName = vendorId ? vendorMap.get(vendorId) : undefined;
        return (
          <span className="text-text-secondary">
            {vendorName ?? "\u2014"}
          </span>
        );
      },
    },
    {
      accessorKey: "activeFlag",
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
}

/* ─── Form ─── */

function TransporterForm({
  item,
  onClose,
  onSaved,
  vendors,
}: {
  item: Transporter | null;
  onClose: () => void;
  onSaved: () => void;
  vendors: Vendor[];
}) {
  const [name, setName] = React.useState(item?.transporterName ?? "");
  const [vendorId, setVendorId] = React.useState(item?.vendorId ?? "__none__");
  const [active, setActive] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const data = {
      transporter_name: name.trim(),
      vendor_id: vendorId === "__none__" ? undefined : vendorId,
      is_active: active,
    };

    try {
      if (item) {
        const result = await transportersApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update transporter", { description: result.error });
          return;
        }
        toast.success("Transporter updated");
      } else {
        const result = await transportersApi.create(data);
        if (result.error) {
          toast.error("Failed to create transporter", { description: result.error });
          return;
        }
        toast.success("Transporter created");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormField label="Transporter Name" required error={errors.name}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Republic Services"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Linked Vendor">
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger>
            <SelectValue placeholder="Select vendor..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {saving ? "Saving..." : item ? "Save Changes" : "Create Transporter"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */


export default function TransportersPage() {
  return (
    <React.Suspense fallback={null}>
      <TransportersContent />
    </React.Suspense>
  );
}

function TransportersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const { vendors } = useVendors();
  const { transporters: allData, loading, refetch } = useTransporters();
  const columns = React.useMemo(() => makeColumns(vendors), [vendors]);

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.transporterName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((t) =>
        statusFilter === "active" ? t.activeFlag : !t.activeFlag
      );
    }
    return result;
  }, [allData, search, statusFilter]);

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

  async function handleDelete(item: Transporter) {
    try {
      const result = await transportersApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete transporter", { description: result.error });
        return;
      }
      toast.success("Transporter deleted");
      refetch();
    } catch {
      toast.error("Failed to delete transporter");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<Transporter>
      title="Transporters"
      subtitle={`${filtered.length} transporters`}
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
      searchPlaceholder="Search transporters..."
      onResetFilters={resetFilters}
      filterSlots={
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
      }
      entityName="Transporter"
      getItemLabel={(item) => item.transporterName}
      onDelete={handleDelete}
      emptyIcon={<Truck className="h-10 w-10" />}
      emptyTitle="No transporters found"
      emptyDescription="Add your first transporter to get started."
      loading={loading}
      formContent={({ item, onClose }) => (
        <TransporterForm
          item={item}
          onClose={onClose}
          onSaved={refetch}
          vendors={vendors}
        />
      )}
    />
    </div>
  );
}
