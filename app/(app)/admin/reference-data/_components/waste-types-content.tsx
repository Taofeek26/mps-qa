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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import { wasteTypesApi } from "@/lib/api-client";
import { useWasteTypes } from "@/lib/hooks/use-api-data";
import {
  SOURCE_CODES,
  FORM_CODES,
  TREATMENT_CODES,
} from "@/lib/reference-data";
import type { WasteType, WasteCategory, TreatmentMethod } from "@/lib/types";

const WASTE_CATEGORIES: WasteCategory[] = [
  "Non Haz",
  "Hazardous Waste",
  "Recycling",
  "C&D",
  "E-Waste",
  "Universal Waste",
  "Special Waste",
  "Medical",
  "Liquid",
  "Fuel",
  "Alternative Reuse",
  "Gas",
];

const TREATMENT_METHODS: TreatmentMethod[] = [
  "Landfill",
  "Recycling",
  "Incineration",
  "Fuel Blending",
  "Reuse",
  "WWTP",
  "MSW Landfill",
  "HAZ Landfill",
  "WTE",
];

function categoryVariant(
  cat: WasteCategory
): "error" | "success" | "warning" | "neutral" {
  switch (cat) {
    case "Hazardous Waste":
      return "error";
    case "Recycling":
      return "success";
    case "Medical":
      return "warning";
    default:
      return "neutral";
  }
}

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
    accessorKey: "wasteCategory",
    header: "Category",
    size: 120,
    cell: ({ getValue }) => {
      const cat = getValue() as WasteCategory | undefined;
      if (!cat) return <span className="text-text-muted">—</span>;
      return <Badge variant={categoryVariant(cat)}>{cat}</Badge>;
    },
  },
  {
    accessorKey: "defaultTreatmentMethod",
    header: "Treatment",
    size: 130,
    cell: ({ getValue }) => {
      const method = getValue() as TreatmentMethod | undefined;
      return (
        <span className="text-text-secondary">
          {method ?? "—"}
        </span>
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
  const [wasteCategory, setWasteCategory] = React.useState<WasteCategory | "">(
    item?.wasteCategory ?? ""
  );
  const [defaultTreatmentMethod, setDefaultTreatmentMethod] = React.useState<
    TreatmentMethod | ""
  >(item?.defaultTreatmentMethod ?? "");
  const [wasteCodes, setWasteCodes] = React.useState(
    item?.defaultWasteCodes ?? ""
  );
  const [sourceCode, setSourceCode] = React.useState(
    item?.defaultSourceCode ?? ""
  );
  const [formCode, setFormCode] = React.useState(item?.defaultFormCode ?? "");
  const [treatmentCode, setTreatmentCode] = React.useState(
    item?.defaultTreatmentCode ?? ""
  );
  const [ewcNumber, setEwcNumber] = React.useState(
    item?.defaultEwcNumber ?? ""
  );
  const [active, setActive] = React.useState(item?.active ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: name.trim(),
      hazardous_flag: hazardous,
      description: description.trim() || undefined,
      waste_category: wasteCategory || undefined,
      default_treatment_method: defaultTreatmentMethod || undefined,
      default_waste_codes: wasteCodes.trim() || undefined,
      default_source_code: sourceCode || undefined,
      default_form_code: formCode || undefined,
      default_treatment_code: treatmentCode || undefined,
      default_ewc_number: ewcNumber.trim() || undefined,
      is_active: active,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await wasteTypesApi.update(item.id, data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Waste type updated");

      } else {
        const result = await wasteTypesApi.create(data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Waste type created");

      }
      onSaved();
      onClose();
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

      {/* ── Classification ── */}
      <div className="border-t border-border-default pt-4 mt-2">
        <p className="text-sm font-medium text-text-primary mb-3">Classification</p>
      </div>

      <FormField label="Waste Category">
        <Select
          value={wasteCategory}
          onValueChange={(v) => setWasteCategory(v as WasteCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {WASTE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Default Treatment Method">
        <Select
          value={defaultTreatmentMethod}
          onValueChange={(v) => setDefaultTreatmentMethod(v as TreatmentMethod)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select treatment method..." />
          </SelectTrigger>
          <SelectContent>
            {TREATMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Waste Codes">
        <TextInput
          value={wasteCodes}
          onChange={(e) => setWasteCodes(e.target.value)}
          placeholder="e.g. D001, D002"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Source Code">
          <Select
            value={sourceCode}
            onValueChange={setSourceCode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source code..." />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_CODES.map((sc) => (
                <SelectItem key={sc.code} value={sc.code}>
                  {sc.code} - {sc.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Form Code">
          <Select
            value={formCode}
            onValueChange={setFormCode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select form code..." />
            </SelectTrigger>
            <SelectContent>
              {FORM_CODES.map((fc) => (
                <SelectItem key={fc.code} value={fc.code}>
                  {fc.code} - {fc.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Treatment Code">
          <Select
            value={treatmentCode}
            onValueChange={setTreatmentCode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment code..." />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_CODES.map((tc) => (
                <SelectItem key={tc.code} value={tc.code}>
                  {tc.code} - {tc.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="EWC Number">
          <TextInput
            value={ewcNumber}
            onChange={(e) => setEwcNumber(e.target.value)}
            placeholder="e.g. 01 01 01"
          />
        </FormField>
      </div>

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

/* ─── Content ─── */

export function WasteTypesContent() {
  const { wasteTypes: allData, refetch } = useWasteTypes();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");

  const filtered = React.useMemo(() => {
    let result = allData;

    if (categoryFilter) {
      result = result.filter((wt) => wt.wasteCategory === categoryFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (wt) =>
          wt.name.toLowerCase().includes(q) ||
          (wt.description?.toLowerCase().includes(q) ?? false)
      );
    }

    return result;
  }, [allData, search, categoryFilter]);

  async function handleDelete(item: WasteType) {
    const result = await wasteTypesApi.delete(item.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Waste type deleted");
    refetch();
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
      filterSlots={
        <div className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {WASTE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      onResetFilters={() => {
        setSearch("");
        setCategoryFilter("");
      }}
      entityName="Waste Type"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<Trash2 className="h-10 w-10" />}
      emptyTitle="No waste types found"
      emptyDescription="Add your first waste type to get started."
      formContent={({ item, onClose }) => (
        <WasteTypeForm item={item} onClose={onClose} onSaved={refetch} />
      )}
    />
  );
}
