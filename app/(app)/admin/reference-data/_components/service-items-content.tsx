"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { Textarea } from "@/components/ui/textarea";
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
import { serviceItemsApi } from "@/lib/api-client";
import { useServiceItems, useWasteTypes } from "@/lib/hooks/use-api-data";
import type { ServiceItem, WasteType } from "@/lib/types";

/* ─── Form ─── */

function ServiceItemForm({
  item,
  onClose,
  onSaved,
  wasteTypes,
}: {
  item: ServiceItem | null;
  onClose: () => void;
  onSaved: () => void;
  wasteTypes: WasteType[];
}) {
  const [serviceName, setServiceName] = React.useState(item?.serviceName ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [defaultWasteTypeId, setDefaultWasteTypeId] = React.useState(item?.defaultWasteTypeId ?? "");
  const [activeFlag, setActiveFlag] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!serviceName.trim()) errs.serviceName = "Service name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      service_name: serviceName.trim(),
      description: description.trim() || undefined,
      default_waste_type_id: defaultWasteTypeId || undefined,
      is_active: activeFlag,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await serviceItemsApi.update(item.id, data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Service item updated");
      } else {
        const result = await serviceItemsApi.create(data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Service item created");
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormField label="Service Name" required error={errors.serviceName}>
        <TextInput
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="e.g. Used Oil Collection"
          error={!!errors.serviceName}
        />
      </FormField>

      <FormField label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
        />
      </FormField>

      <FormField label="Default Waste Type">
        <Select value={defaultWasteTypeId} onValueChange={setDefaultWasteTypeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select waste type..." />
          </SelectTrigger>
          <SelectContent>
            {wasteTypes.map((wt) => (
              <SelectItem key={wt.id} value={wt.id}>
                {wt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Active">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={activeFlag} onCheckedChange={setActiveFlag} />
          <span className="text-sm text-text-secondary">
            {activeFlag ? "Active" : "Inactive"}
          </span>
        </div>
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {item ? "Save Changes" : "Create Service Item"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Content ─── */

export function ServiceItemsContent() {
  const { serviceItems: allData, refetch } = useServiceItems();
  const { wasteTypes } = useWasteTypes();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  // Create lookup map for efficient column rendering
  const wasteTypesMap = React.useMemo(() => {
    const map = new Map<string, WasteType>();
    wasteTypes.forEach((wt) => map.set(wt.id, wt));
    return map;
  }, [wasteTypes]);

  // Define columns inside component to access lookup map
  const columns: ColumnDef<ServiceItem, unknown>[] = React.useMemo(() => [
    {
      accessorKey: "serviceName",
      header: "Service Name",
      size: 250,
    },
    {
      accessorKey: "defaultWasteTypeId",
      header: "Default Waste Type",
      size: 200,
      cell: ({ getValue }) => {
        const wasteTypeId = getValue() as string | undefined;
        if (!wasteTypeId) return <span className="text-text-secondary">&mdash;</span>;
        const wt = wasteTypesMap.get(wasteTypeId);
        return (
          <span className="text-text-secondary">{wt?.name ?? "\u2014"}</span>
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
  ], [wasteTypesMap]);

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.serviceName.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((s) =>
        statusFilter === "active" ? s.activeFlag : !s.activeFlag
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

  async function handleDelete(item: ServiceItem) {
    const result = await serviceItemsApi.delete(item.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Service item deleted");
    refetch();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<ServiceItem>
      title="Service Items"
      subtitle={`${filtered.length} service items`}
      columns={columns}
      data={paginatedData}
      pagination={{
        page: safePage,
        pageSize: pageSize,
        total: filtered.length,
      }}
      onPaginationChange={setPage}
      searchValue={search}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search service items..."
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
      entityName="Service Item"
      getItemLabel={(item) => item.serviceName}
      onDelete={handleDelete}
      emptyIcon={<Wrench className="h-10 w-10" />}
      emptyTitle="No service items found"
      emptyDescription="Add your first service item to get started."
      formContent={({ item, onClose }) => (
        <ServiceItemForm
          item={item}
          onClose={onClose}
          onSaved={refetch}
          wasteTypes={wasteTypes}
        />
      )}
    />
    </div>
  );
}
