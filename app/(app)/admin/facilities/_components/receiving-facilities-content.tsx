"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { Factory } from "lucide-react";
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
import { useReceivingFacilities } from "@/lib/hooks/use-api-data";
import { receivingFacilitiesApi, referenceDataApi } from "@/lib/api-client";
import type { ReceivingFacilityEntity, ReceivingCompany } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/* ─── Helpers ─── */

function getCompanyName(
  companyId: string,
  companies: ReceivingCompany[]
): string {
  return companies.find((c) => c.id === companyId)?.companyName ?? "Unknown";
}

/* ─── Columns ─── */

function buildColumns(
  companies: ReceivingCompany[]
): ColumnDef<ReceivingFacilityEntity, unknown>[] {
  return [
    {
      accessorKey: "facilityName",
      header: "Facility Name",
      size: 200,
    },
    {
      accessorKey: "receivingCompanyId",
      header: "Company",
      size: 180,
      cell: ({ getValue }) => (
        <span className="text-text-secondary">
          {getCompanyName(getValue() as string, companies)}
        </span>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
      size: 130,
      cell: ({ getValue }) => (
        <span className="text-text-secondary">
          {(getValue() as string) || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "stateCode",
      header: "State",
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-text-secondary">
          {(getValue() as string) || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "epaIdNumber",
      header: "EPA ID",
      size: 140,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        return val ? (
          <span className="font-mono text-xs">{val}</span>
        ) : (
          <span className="text-text-muted">{"\u2014"}</span>
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

function ReceivingFacilityForm({
  item,
  onClose,
  onSaved,
  companies,
}: {
  item: ReceivingFacilityEntity | null;
  onClose: () => void;
  onSaved: () => void;
  companies: ReceivingCompany[];
}) {
  const [facilityName, setFacilityName] = React.useState(
    item?.facilityName ?? ""
  );
  const [receivingCompanyId, setReceivingCompanyId] = React.useState(
    item?.receivingCompanyId ?? ""
  );
  const [address, setAddress] = React.useState(item?.addressLine1 ?? "");
  const [city, setCity] = React.useState(item?.city ?? "");
  const [state, setState] = React.useState(item?.stateCode ?? "");
  const [zipCode, setZipCode] = React.useState(item?.postalCode ?? "");
  const [epaIdNumber, setEpaIdNumber] = React.useState(
    item?.epaIdNumber ?? ""
  );
  const [active, setActive] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!facilityName.trim()) errs.facilityName = "Facility name is required";
    if (!receivingCompanyId)
      errs.receivingCompanyId = "Receiving company is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const data = {
      facility_name: facilityName.trim(),
      receiving_company_id: receivingCompanyId,
      address_line1: address.trim() || undefined,
      city: city.trim() || undefined,
      state_code: state.trim() || undefined,
      postal_code: zipCode.trim() || undefined,
      epa_id_number: epaIdNumber.trim() || undefined,
      is_active: active,
    };

    try {
      if (item) {
        const result = await receivingFacilitiesApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update facility", { description: result.error });
          return;
        }
        toast.success("Receiving facility updated");
      } else {
        const result = await receivingFacilitiesApi.create(data);
        if (result.error) {
          toast.error("Failed to create facility", { description: result.error });
          return;
        }
        toast.success("Receiving facility created");
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
      <FormField label="Facility Name" required error={errors.facilityName}>
        <TextInput
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          placeholder="e.g. Clean Harbors - Kimball"
          error={!!errors.facilityName}
        />
      </FormField>

      <FormField
        label="Receiving Company"
        required
        error={errors.receivingCompanyId}
      >
        <Select
          value={receivingCompanyId}
          onValueChange={setReceivingCompanyId}
        >
          <SelectTrigger error={!!errors.receivingCompanyId}>
            <SelectValue placeholder="Select company..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Address">
        <TextInput
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 1234 Industrial Blvd"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      <FormField label="Zip Code">
        <TextInput
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="e.g. 44112"
        />
      </FormField>

      <FormField label="EPA ID #">
        <TextInput
          value={epaIdNumber}
          onChange={(e) => setEpaIdNumber(e.target.value)}
          placeholder="e.g. OHD123456789"
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
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Facility"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Content ─── */


export function ReceivingFacilitiesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [companies, setCompanies] = React.useState<ReceivingCompany[]>([]);

  const { facilities: allData, loading, refetch } = useReceivingFacilities();
  const columns = React.useMemo(() => buildColumns(companies), [companies]);

  // Fetch receiving companies on mount
  React.useEffect(() => {
    async function fetchCompanies() {
      const result = await referenceDataApi.getReceivingCompanies();
      if (result.data?.receiving_companies) {
        // Transform snake_case to camelCase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = result.data.receiving_companies.map((rc: any) => ({
          id: rc.id,
          companyName: rc.company_name ?? rc.companyName ?? '',
          activeFlag: rc.active ?? rc.activeFlag ?? true,
        }));
        setCompanies(transformed);
      }
    }
    fetchCompanies();
  }, []);

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) =>
        f.facilityName.toLowerCase().includes(q)
      );
    }
    if (companyFilter) {
      result = result.filter((f) => f.receivingCompanyId === companyFilter);
    }
    if (statusFilter) {
      result = result.filter((f) =>
        statusFilter === "active" ? f.activeFlag : !f.activeFlag
      );
    }
    return result;
  }, [allData, search, companyFilter, statusFilter]);

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

  async function handleDelete(item: ReceivingFacilityEntity) {
    try {
      const result = await receivingFacilitiesApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete facility", { description: result.error });
        return;
      }
      toast.success("Receiving facility deleted");
      refetch();
    } catch {
      toast.error("Failed to delete facility");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleCompanyChange(value: string) {
    setCompanyFilter(value);
    resetPage();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setCompanyFilter("");
    setStatusFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<ReceivingFacilityEntity>
      title="Receiving Facilities"
      subtitle={`${filtered.length} facilities`}
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
      searchPlaceholder="Search facilities..."
      onResetFilters={resetFilters}
      filterSlots={
        <>
          <div className="w-full sm:w-44">
            <Select value={companyFilter} onValueChange={handleCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </>
      }
      entityName="Receiving Facility"
      getItemLabel={(item) => item.facilityName}
      onDelete={handleDelete}
      emptyIcon={<Factory className="h-10 w-10" />}
      emptyTitle="No receiving facilities found"
      emptyDescription="Add your first receiving facility to get started."
      loading={loading}
      formContent={({ item, onClose }) => (
        <ReceivingFacilityForm
          item={item}
          onClose={onClose}
          onSaved={refetch}
          companies={companies}
        />
      )}
    />
    </div>
  );
}
