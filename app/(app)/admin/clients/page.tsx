"use client";

import * as React from "react";
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
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/mock-data";
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
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    size: 150,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    size: 130,
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

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: name.trim(),
      industry: industry || undefined,
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      active,
    };

    if (item) {
      updateClient(item.id, data);
      toast.success("Client updated");
    } else {
      createClient(data);
      toast.success("Client created");
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
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {item ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

const PAGE_SIZE = 10;

export default function ClientsPage() {
  return (
    <React.Suspense fallback={null}>
      <ClientsContent />
    </React.Suspense>
  );
}

function ClientsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState("");

  const allData = React.useMemo(() => getClients(), [refreshKey]);

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

  function handleDelete(item: Client) {
    deleteClient(item.id);
    toast.success("Client deleted");
    refresh();
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
    <CrudTable<Client>
      title="Clients"
      subtitle={`${filtered.length} clients`}
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
      formContent={({ item, onClose }) => (
        <ClientForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
  );
}
