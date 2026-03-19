"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
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
import { sitesApi } from "@/lib/api-client";
import { useSites, useClients } from "@/lib/hooks/use-api-data";
import type { Site } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const REGIONS = ["Northwest", "West", "Mountain", "Midwest", "Southwest", "Southeast", "Northeast"];


/* ─── Page ─── */

export default function SitesPage() {
  return (
    <React.Suspense fallback={null}>
      <SitesContent />
    </React.Suspense>
  );
}

function SitesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [clientFilter, setClientFilter] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");

  // Fetch data from API
  const { sites: allData, refetch } = useSites();
  const { clients } = useClients();
  const clientMap = React.useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const columns: ColumnDef<Site, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 220,
      },
      {
        accessorKey: "clientId",
        header: "Client",
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">
            {clientMap.get(getValue() as string) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "region",
        header: "Region",
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        size: 130,
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
        accessorKey: "address",
        header: "Address",
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-text-secondary truncate block max-w-[180px]">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "zipCode",
        header: "Zip Code",
        size: 90,
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
    ],
    [clientMap]
  );

  // allData is already from useSites() hook above

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.city?.toLowerCase().includes(q) ?? false)
      );
    }
    if (clientFilter) {
      result = result.filter((s) => s.clientId === clientFilter);
    }
    if (regionFilter) {
      result = result.filter((s) => s.region === regionFilter);
    }
    return result;
  }, [allData, search, clientFilter, regionFilter]);

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

  async function handleDelete(item: Site) {
    try {
      const result = await sitesApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Site deleted");
      refetch();
    } catch {
      toast.error("Failed to delete site");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleClientChange(value: string) {
    setClientFilter(value);
    resetPage();
  }

  function handleRegionChange(value: string) {
    setRegionFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setClientFilter("");
    setRegionFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<Site>
      title="Sites"
      subtitle={`${filtered.length} sites`}
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
      searchPlaceholder="Search sites..."
      onResetFilters={resetFilters}
      filterSlots={
        <>
          <div className="w-full sm:w-48">
            <Select value={clientFilter} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select value={regionFilter} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      entityName="Site"
      getItemLabel={(item) => item.name}
      onDelete={handleDelete}
      emptyIcon={<MapPin className="h-10 w-10" />}
      emptyTitle="No sites found"
      emptyDescription="Add your first site to get started."
      formContent={({ item, onClose }) => (
        <SiteForm
          item={item}
          clients={clients}
          onClose={onClose}
          onSaved={refetch}
        />
      )}
    />
    </div>
  );
}

/* ─── Form ─── */

function SiteForm({
  item,
  clients,
  onClose,
  onSaved,
}: {
  item: Site | null;
  clients: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [clientId, setClientId] = React.useState(item?.clientId ?? "");
  const [region, setRegion] = React.useState(item?.region ?? "");
  const [address, setAddress] = React.useState(item?.address ?? "");
  const [city, setCity] = React.useState(item?.city ?? "");
  const [state, setState] = React.useState(item?.state ?? "");
  const [zipCode, setZipCode] = React.useState(item?.zipCode ?? "");
  const [active, setActive] = React.useState(item?.active ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!clientId) errs.clientId = "Client is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: name.trim(),
      clientId,
      region: region || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      active,
    };

    try {
      if (item) {
        const result = await sitesApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Site updated");

      } else {
        const result = await sitesApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Site created");

      }
      onSaved();
      onClose();
    } catch {
      toast.error("Operation failed");
    }
  }

  return (
    <div className="space-y-4">
      <FormField label="Name" required error={errors.name}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Downtown Tower Project"
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Client" required error={errors.clientId}>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger error={!!errors.clientId}>
            <SelectValue placeholder="Select client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Region">
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue placeholder="Select region..." />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Address">
        <TextInput
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street address"
        />
      </FormField>

      <FormField label="City">
        <TextInput
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {item ? "Save Changes" : "Create Site"}
        </Button>
      </div>
    </div>
  );
}
