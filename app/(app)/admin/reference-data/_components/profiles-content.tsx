"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
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
  getProfiles,
  getClients,
  getWasteTypes,
  createProfile,
  updateProfile,
  deleteProfile,
} from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

/* ─── Columns ─── */

const columns: ColumnDef<Profile, unknown>[] = [
  {
    accessorKey: "profileNumber",
    header: "Profile #",
    size: 140,
    cell: ({ getValue }) => (
      <span className="font-mono">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "customerId",
    header: "Customer",
    size: 200,
    cell: ({ getValue }) => {
      const customerId = getValue() as string | undefined;
      if (!customerId) return <span className="text-text-secondary">&mdash;</span>;
      const client = getClients().find((c) => c.id === customerId);
      return (
        <span className="text-text-secondary">{client?.name ?? "\u2014"}</span>
      );
    },
  },
  {
    accessorKey: "wasteTypeId",
    header: "Waste Type",
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

function ProfileForm({
  item,
  onClose,
  onSaved,
}: {
  item: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const clients = React.useMemo(() => getClients(), []);
  const wasteTypes = React.useMemo(() => getWasteTypes(), []);
  const [profileNumber, setProfileNumber] = React.useState(item?.profileNumber ?? "");
  const [customerId, setCustomerId] = React.useState(item?.customerId ?? "");
  const [wasteTypeId, setWasteTypeId] = React.useState(item?.wasteTypeId ?? "");
  const [activeFlag, setActiveFlag] = React.useState(item?.activeFlag ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!profileNumber.trim()) errs.profileNumber = "Profile number is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      profileNumber: profileNumber.trim(),
      customerId: customerId || undefined,
      wasteTypeId: wasteTypeId || undefined,
      activeFlag,
    };

    if (item) {
      updateProfile(item.id, data);
      toast.success("Profile updated");
    } else {
      createProfile(data);
      toast.success("Profile created");
    }

    onSaved();
    onClose();
  }

  return (
    <div className="space-y-4">
      <FormField label="Profile Number" required error={errors.profileNumber}>
        <TextInput
          value={profileNumber}
          onChange={(e) => setProfileNumber(e.target.value)}
          placeholder="e.g. 41587"
          error={!!errors.profileNumber}
        />
      </FormField>

      <FormField label="Customer">
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer..." />
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

      <FormField label="Waste Type">
        <Select value={wasteTypeId} onValueChange={setWasteTypeId}>
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
          {item ? "Save Changes" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Content ─── */


export function ProfilesContent() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const allData = React.useMemo(() => getProfiles(), [refreshKey]);

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.profileNumber.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((p) =>
        statusFilter === "active" ? p.activeFlag : !p.activeFlag
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

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleDelete(item: Profile) {
    deleteProfile(item.id);
    toast.success("Profile deleted");
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
    <div ref={tableRef}>
    <CrudTable<Profile>
      title="Profiles"
      subtitle={`${filtered.length} profiles`}
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
      searchPlaceholder="Search by profile number..."
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
      entityName="Profile"
      getItemLabel={(item) => item.profileNumber}
      onDelete={handleDelete}
      emptyIcon={<FileText className="h-10 w-10" />}
      emptyTitle="No profiles found"
      emptyDescription="Add your first profile to get started."
      formContent={({ item, onClose }) => (
        <ProfileForm item={item} onClose={onClose} onSaved={refresh} />
      )}
    />
    </div>
  );
}
