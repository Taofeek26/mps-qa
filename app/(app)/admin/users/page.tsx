"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import { usersApi } from "@/lib/api-client";
import { useUsers, useSites } from "@/lib/hooks/use-api-data";
import type { User, UserRole } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "operator", label: "Operator" },
  { value: "viewer", label: "Viewer" },
];

const roleBadgeVariant: Record<UserRole, BadgeVariant> = {
  admin: "error",
  manager: "warning",
  operator: "info",
  viewer: "neutral",
};

const roleLabel: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  operator: "Operator",
  viewer: "Viewer",
};

/* ─── Page ─── */


export default function UsersPage() {
  return (
    <React.Suspense fallback={null}>
      <UsersContent />
    </React.Suspense>
  );
}

function UsersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Fetch data from API
  const { users: allData, refetch } = useUsers();
  const { sites } = useSites();
  const siteMap = React.useMemo(
    () => new Map(sites.map((s) => [s.id, s.name])),
    [sites]
  );
  const siteOptions = React.useMemo(
    () => sites.map((s) => ({ value: s.id, label: s.name })),
    [sites]
  );

  const columns: ColumnDef<User, unknown>[] = React.useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        size: 48,
        enableSorting: false,
        cell: ({ row }) => {
          const initials = row.original.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-400/20 text-[11px] font-bold text-success-600">
              {initials}
            </div>
          );
        },
      },
      {
        accessorKey: "displayName",
        header: "Name",
        size: 180,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 120,
        cell: ({ getValue }) => {
          const role = getValue() as UserRole;
          return (
            <Badge variant={roleBadgeVariant[role]}>
              {roleLabel[role]}
            </Badge>
          );
        },
      },
      {
        id: "sites",
        header: "Assigned Sites",
        size: 240,
        enableSorting: false,
        cell: ({ row }) => {
          const ids = row.original.assignedSiteIds ?? [];
          if (ids.length === 0) {
            return <span className="text-text-muted text-sm">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {ids.slice(0, 2).map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center rounded-[4px] bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-primary"
                >
                  {siteMap.get(id) ?? id}
                </span>
              ))}
              {ids.length > 2 && (
                <span className="text-xs font-medium text-text-muted">
                  +{ids.length - 2} more
                </span>
              )}
            </div>
          );
        },
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
    [siteMap]
  );

  // allData is from useUsers() hook above

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter) {
      result = result.filter((u) =>
        statusFilter === "active" ? u.active : !u.active
      );
    }
    return result;
  }, [allData, search, roleFilter, statusFilter]);

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

  function refresh() {
    refetch();
  }

  async function handleDelete(item: User) {
    try {
      const result = await usersApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("User deleted");
      refetch();
    } catch {
      toast.error("Failed to delete user");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value);
    resetPage();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
    <CrudTable<User>
      title="Users & Roles"
      subtitle={`${filtered.length} users`}
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
      searchPlaceholder="Search by name or email..."
      onResetFilters={resetFilters}
      filterSlots={
        <>
          <div className="w-full sm:w-40">
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
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
      entityName="User"
      getItemLabel={(item) => item.displayName}
      onDelete={handleDelete}
      emptyIcon={<Users className="h-10 w-10" />}
      emptyTitle="No users found"
      emptyDescription="Invite your first user to get started."
      formContent={({ item, onClose }) => (
        <UserForm
          item={item}
          siteOptions={siteOptions}
          onClose={onClose}
          onSaved={refresh}
        />
      )}
    />
    </div>
  );
}

/* ─── Form ─── */

function UserForm({
  item,
  siteOptions,
  onClose,
  onSaved,
}: {
  item: User | null;
  siteOptions: { value: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = React.useState(item?.email ?? "");
  const [displayName, setDisplayName] = React.useState(item?.displayName ?? "");
  const [role, setRole] = React.useState<UserRole | "">(item?.role ?? "");
  const [assignedSiteIds, setAssignedSiteIds] = React.useState<string[]>(
    item?.assignedSiteIds ?? []
  );
  const [active, setActive] = React.useState(item?.active ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (!role) errs.role = "Role is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      email: email.trim(),
      name: displayName.trim(),
      role: role as UserRole,
      is_active: active,
      assigned_site_ids: role !== "admin" ? assignedSiteIds : undefined,
    };

    try {
      if (item) {
        const result = await usersApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("User updated");
      } else {
        const result = await usersApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("User created");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Operation failed");
    }
  }

  return (
    <div className="space-y-4">
      <FormField label="Email" required error={errors.email}>
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@mpsgrp.com"
          error={!!errors.email}
        />
      </FormField>

      <FormField label="Display Name" required error={errors.displayName}>
        <TextInput
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Cooper"
          error={!!errors.displayName}
        />
      </FormField>

      <FormField label="Role" required error={errors.role}>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger error={!!errors.role}>
            <SelectValue placeholder="Select role..." />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {role && role !== "admin" && (
        <FormField label="Assigned Sites">
          <MultiSelect
            options={siteOptions}
            value={assignedSiteIds}
            onChange={setAssignedSiteIds}
            placeholder="Select sites..."
          />
        </FormField>
      )}

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
          {item ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </div>
  );
}
