"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { Briefcase } from "lucide-react";
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
import { useClients } from "@/lib/hooks/use-api-data";
import { customersApi } from "@/lib/api-client";
import type { Client } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const INDUSTRIES = ["Construction", "Manufacturing", "Real Estate", "Government", "Other"];

/* ─── Columns ─── */

const columns: ColumnDef<Client, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 260,
  },
  {
    accessorKey: "industry",
    header: "Industry",
    size: 160,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "\u2014"}</span>
    ),
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    size: 150,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "\u2014"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    size: 130,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "\u2014"}</span>
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

function ClientForm({
  item,
  onClose,
  onSaved,
}: {
  item: Client | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [industry, setIndustry] = React.useState(item?.industry ?? "");
  const [contactPerson, setContactPerson] = React.useState(item?.contactPerson ?? "");
  const [phone, setPhone] = React.useState(item?.phone ?? "");
  const [address, setAddress] = React.useState(item?.address ?? "");
  const [city, setCity] = React.useState(item?.city ?? "");
  const [state, setState] = React.useState(item?.state ?? "");
  const [zipCode, setZipCode] = React.useState(item?.zipCode ?? "");
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

    setSaving(true);
    const data = {
      name: name.trim(),
      industry: industry || undefined,
      contact_person: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip_code: zipCode.trim() || undefined,
      is_active: active,
    };

    try {
      if (item) {
        const result = await customersApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update client", { description: result.error });
          return;
        }
        toast.success("Client updated");
      } else {
        const result = await customersApi.create(data);
        if (result.error) {
          toast.error("Failed to create client", { description: result.error });
          return;
        }
        toast.success("Client created");
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
      <FormField label="Name" required error={errors.name}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Infrastructure"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Industry">
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Select industry..." />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Contact Person">
        <TextInput
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          placeholder="e.g. John Smith"
        />
      </FormField>

      <FormField label="Phone">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. (555) 123-4567"
        />
      </FormField>

      {/* ─── Address Section ─── */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Address
        </p>

        <div className="space-y-4">
          <FormField label="Address">
            <TextInput
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <FormField label="Zip Code">
              <TextInput
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Zip code"
              />
            </FormField>
          </div>
        </div>
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
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Clients Content ─── */


export function ClientsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState("");

  const { clients: allData, loading, refetch } = useClients();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (industryFilter) {
      result = result.filter((c) => c.industry === industryFilter);
    }
    return result;
  }, [allData, search, industryFilter]);

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

  async function handleDelete(item: Client) {
    try {
      const result = await customersApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete client", { description: result.error });
        return;
      }
      toast.success("Client deleted");
      refetch();
    } catch {
      toast.error("Failed to delete client");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleIndustryChange(value: string) {
    setIndustryFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setIndustryFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<Client>
      title="Clients"
      subtitle={`${filtered.length} clients`}
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
      searchPlaceholder="Search clients..."
      onResetFilters={resetFilters}
      filterSlots={
        <div className="w-full sm:w-44">
          <Select value={industryFilter} onValueChange={handleIndustryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      entityName="Client"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<Briefcase className="h-10 w-10" />}
      emptyTitle="No clients found"
      emptyDescription="Add your first client to get started."
      loading={loading}
      formContent={({ item, onClose }) => (
        <ClientForm item={item} onClose={onClose} onSaved={refetch} />
      )}
    />
    </div>
  );
}
