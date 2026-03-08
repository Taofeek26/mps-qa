"use client";

import * as React from "react";
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
import {
  getServiceItems,
  getWasteTypes,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
} from "@/lib/mock-data";
import type { ServiceItem } from "@/lib/types";

/* ─── Columns ─── */

const columns: ColumnDef<ServiceItem, unknown>[] = [
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
      const wt = getWasteTypes().find((w) => w.id === wasteTypeId);
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
];

/* ─── Form ─── */

function ServiceItemForm({
  item,
  onClose,
  onSaved,
}: {
  item: ServiceItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const wasteTypes = React.useMemo(() => getWasteTypes(), []);
  const [serviceName, setServiceName] = React.useState(item?.serviceName ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [defaultWasteTypeId, setDefaultWasteTypeId] = React.useState(item?.defaultWasteTypeId ?? "");
  const [activeFlag, setActiveFlag] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!serviceName.trim()) errs.serviceName = "Service name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      serviceName: serviceName.trim(),
      description: description.trim() || undefined,
      defaultWasteTypeId: defaultWasteTypeId || undefined,
      activeFlag,
    };

    if (item) {
      updateServiceItem(item.id, data);
      toast.success("Service item updated");
    } else {
      createServiceItem(data);
      toast.success("Service item created");
    }

    onSaved();
    onClose();
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
        <Button onClick={handleSave}>
          {item ? "Save Changes" : "Create Service Item"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Content ─── */

const PAGE_SIZE = 10;

export function ServiceItemsContent() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const allData = React.useMemo(() => getServiceItems(), [refreshKey]);

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedData = React.useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleDelete(item: ServiceItem) {
    deleteServiceItem(item.id);
    toast.success("Service item deleted");
    refresh();
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
    <CrudTable<ServiceItem>
      title="Service Items"
      subtitle={`${filtered.length} service items`}
      columns={columns}
      data={paginatedData}
      pagination={{
        page: safePage,
        pageSize: PAGE_SIZE,
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
        <ServiceItemForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
  );
}
