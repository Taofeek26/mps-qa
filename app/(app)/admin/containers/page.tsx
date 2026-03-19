"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
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
import { useContainers } from "@/lib/hooks/use-api-data";
import { containersApi, referenceDataApi } from "@/lib/api-client";
import type { ContainerEntity, UnitEntity } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/* ─── Columns ─── */

function buildColumns(units: UnitEntity[]): ColumnDef<ContainerEntity, unknown>[] {
  const unitMap = new Map(units.map((u) => [u.id, u.unitName]));

  return [
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
      cell: ({ row }) => {
        const { nominalCapacityValue, nominalCapacityUnitId } = row.original;
        if (nominalCapacityValue == null) {
          return <span className="text-text-secondary">&mdash;</span>;
        }
        const unitName = nominalCapacityUnitId ? unitMap.get(nominalCapacityUnitId) : undefined;
        return (
          <span className="text-text-primary">
            {nominalCapacityValue}
            {unitName ? ` ${unitName}` : ""}
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

function ContainerForm({
  item,
  onClose,
  onSaved,
  units,
}: {
  item: ContainerEntity | null;
  onClose: () => void;
  onSaved: () => void;
  units: UnitEntity[];
}) {
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
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!containerName.trim()) errs.containerName = "Container name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const capacityNum = nominalCapacityValue ? Number(nominalCapacityValue) : undefined;

    const data = {
      container_name: containerName.trim(),
      container_family: containerFamily.trim() || undefined,
      nominal_capacity_value: capacityNum,
      nominal_capacity_unit_id: nominalCapacityUnitId || undefined,
      is_active: activeFlag,
    };

    try {
      if (item) {
        const result = await containersApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update container", { description: result.error });
          return;
        }
        toast.success("Container updated");

      } else {
        const result = await containersApi.create(data);
        if (result.error) {
          toast.error("Failed to create container", { description: result.error });
          return;
        }
        toast.success("Container created");

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
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Container"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */


export default function ContainersPage() {
  return (
    <React.Suspense fallback={null}>
      <ContainersContent />
    </React.Suspense>
  );
}

function ContainersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [units, setUnits] = React.useState<UnitEntity[]>([]);

  const { containers: allData, loading, refetch } = useContainers();

  // Fetch units on mount
  React.useEffect(() => {
    async function fetchUnits() {
      const result = await referenceDataApi.getUnits();
      if (result.data?.units) {
        setUnits(result.data.units as UnitEntity[]);
      }
    }
    fetchUnits();
  }, []);

  const columns = React.useMemo(() => buildColumns(units), [units]);

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

  async function handleDelete(item: ContainerEntity) {
    try {
      const result = await containersApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete container", { description: result.error });
        return;
      }
      toast.success("Container deleted");
      refetch();
    } catch {
      toast.error("Failed to delete container");
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
    <CrudTable<ContainerEntity>
      title="Containers"
      subtitle={`${filtered.length} containers`}
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
      loading={loading}
      formContent={({ item, onClose }) => (
        <ContainerForm item={item} onClose={onClose} onSaved={refetch} units={units} />
      )}
    />
    </div>
  );
}
