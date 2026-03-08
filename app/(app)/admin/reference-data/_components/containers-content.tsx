"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { NumberInput } from "@/components/ui/number-input";
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
  getContainerEntities,
  getUnits,
  createContainer,
  updateContainer,
  deleteContainer,
} from "@/lib/mock-data";
import type { ContainerEntity } from "@/lib/types";

/* ─── Columns ─── */

function CapacityCell({ row }: { row: { original: ContainerEntity } }) {
  const { nominalCapacityValue, nominalCapacityUnitId } = row.original;
  if (nominalCapacityValue == null) {
    return <span className="text-text-secondary">&mdash;</span>;
  }
  const unit = nominalCapacityUnitId
    ? getUnits().find((u) => u.id === nominalCapacityUnitId)
    : undefined;
  return (
    <span className="text-text-primary">
      {nominalCapacityValue}
      {unit ? ` ${unit.unitName}` : ""}
    </span>
  );
}

const columns: ColumnDef<ContainerEntity, unknown>[] = [
  {
    accessorKey: "containerName",
    header: "Container Name",
    size: 200,
  },
  {
    accessorKey: "containerFamily",
    header: "Family",
    size: 140,
    cell: ({ getValue }) => {
      const family = getValue() as string | undefined;
      return (
        <span className="text-text-secondary">{family || "\u2014"}</span>
      );
    },
  },
  {
    id: "capacity",
    header: "Capacity",
    size: 130,
    cell: ({ row }) => <CapacityCell row={row} />,
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

function ContainerForm({
  item,
  onClose,
  onSaved,
}: {
  item: ContainerEntity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const units = React.useMemo(() => getUnits(), []);
  const [containerName, setContainerName] = React.useState(item?.containerName ?? "");
  const [containerFamily, setContainerFamily] = React.useState(item?.containerFamily ?? "");
  const [nominalCapacityValue, setNominalCapacityValue] = React.useState<string>(
    item?.nominalCapacityValue != null ? String(item.nominalCapacityValue) : ""
  );
  const [nominalCapacityUnitId, setNominalCapacityUnitId] = React.useState(
    item?.nominalCapacityUnitId ?? ""
  );
  const [activeFlag, setActiveFlag] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!containerName.trim()) errs.containerName = "Container name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const capacityNum = nominalCapacityValue ? Number(nominalCapacityValue) : undefined;

    const data = {
      containerName: containerName.trim(),
      containerFamily: containerFamily.trim() || undefined,
      nominalCapacityValue: capacityNum,
      nominalCapacityUnitId: nominalCapacityUnitId || undefined,
      activeFlag,
    };

    if (item) {
      updateContainer(item.id, data);
      toast.success("Container updated");
    } else {
      createContainer(data);
      toast.success("Container created");
    }

    onSaved();
    onClose();
  }

  return (
    <div className="space-y-4">
      <FormField label="Container Name" required error={errors.containerName}>
        <TextInput
          value={containerName}
          onChange={(e) => setContainerName(e.target.value)}
          placeholder="e.g. 55gal Drum"
          error={!!errors.containerName}
        />
      </FormField>

      <FormField label="Container Family">
        <TextInput
          value={containerFamily}
          onChange={(e) => setContainerFamily(e.target.value)}
          placeholder="e.g. Drum, Tote, Vehicle"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nominal Capacity">
          <NumberInput
            value={nominalCapacityValue}
            onChange={(e) => setNominalCapacityValue(e.target.value)}
            placeholder="e.g. 55"
            min={0}
          />
        </FormField>
        <FormField label="Capacity Unit">
          <Select value={nominalCapacityUnitId} onValueChange={setNominalCapacityUnitId}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit..." />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.unitName} ({u.unitCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

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
          {item ? "Save Changes" : "Create Container"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Content ─── */

const PAGE_SIZE = 10;

export function ContainersContent() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const allData = React.useMemo(() => getContainerEntities(), [refreshKey]);

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.containerName.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((c) =>
        statusFilter === "active" ? c.activeFlag : !c.activeFlag
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

  function handleDelete(item: ContainerEntity) {
    deleteContainer(item.id);
    toast.success("Container deleted");
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
    <CrudTable<ContainerEntity>
      title="Containers"
      subtitle={`${filtered.length} containers`}
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
      searchPlaceholder="Search containers..."
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
      entityName="Container"
      getItemLabel={(item) => item.containerName}
      onDelete={handleDelete}
      emptyIcon={<Box className="h-10 w-10" />}
      emptyTitle="No containers found"
      emptyDescription="Add your first container to get started."
      formContent={({ item, onClose }) => (
        <ContainerForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
  );
}
