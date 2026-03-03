"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import {
  getWasteTypes,
  createWasteType,
  updateWasteType,
  deleteWasteType,
} from "@/lib/mock-data";
import type { WasteType } from "@/lib/types";

/* ─── Columns ─── */

const columns: ColumnDef<WasteType, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
  },
  {
    accessorKey: "hazardousFlag",
    header: "Hazardous",
    size: 110,
    cell: ({ getValue }) => {
      const hazardous = getValue() as boolean;
      return (
        <Badge variant={hazardous ? "error" : "success"}>
          {hazardous ? "Hazardous" : "Safe"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 280,
    cell: ({ getValue }) => (
      <span className="text-text-secondary truncate block max-w-[280px]">
        {(getValue() as string) || "—"}
      </span>
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

function WasteTypeForm({
  item,
  onClose,
  onSaved,
}: {
  item: WasteType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [hazardous, setHazardous] = React.useState(item?.hazardousFlag ?? false);
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [active, setActive] = React.useState(item?.active ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: name.trim(),
      hazardousFlag: hazardous,
      description: description.trim() || undefined,
      active,
    };

    if (item) {
      updateWasteType(item.id, data);
      toast.success("Waste type updated");
    } else {
      createWasteType(data);
      toast.success("Waste type created");
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
          placeholder="e.g. Construction Debris"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Hazardous">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={hazardous} onCheckedChange={setHazardous} />
          <span className="text-sm text-text-secondary">
            {hazardous ? "Yes — hazardous material" : "No — non-hazardous"}
          </span>
        </div>
      </FormField>

      <FormField label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this waste type..."
          rows={3}
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
          {item ? "Save Changes" : "Create Waste Type"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function WasteTypesPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const allData = React.useMemo(() => getWasteTypes(), [refreshKey]);

  const filtered = React.useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (wt) =>
        wt.name.toLowerCase().includes(q) ||
        (wt.description?.toLowerCase().includes(q) ?? false)
    );
  }, [allData, search]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleDelete(item: WasteType) {
    deleteWasteType(item.id);
    toast.success("Waste type deleted");
    refresh();
  }

  return (
    <CrudTable<WasteType>
      title="Waste Types"
      subtitle="Manage waste classification categories"
      columns={columns}
      data={filtered}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search waste types..."
      entityName="Waste Type"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<Trash2 className="h-10 w-10" />}
      emptyTitle="No waste types found"
      emptyDescription="Add your first waste type to get started."
      formContent={({ item, onClose }) => (
        <WasteTypeForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
  );
}
