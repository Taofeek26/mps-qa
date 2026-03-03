"use client";

import * as React from "react";
import { type SortingState } from "@tanstack/react-table";
import { AuditLogTable } from "@/components/patterns/audit-log-table";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAuditLog, getUsers } from "@/lib/mock-data";
import type { AuditLogFilters } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const ACTION_TYPES = ["create", "update", "delete", "login", "export"];
const ENTITY_TYPES = ["shipment", "vendor", "site", "waste_type", "client", "user", "session"];

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  return (
    <React.Suspense fallback={null}>
      <AuditLogContent />
    </React.Suspense>
  );
}

function AuditLogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const [sorting, setSorting] = React.useState<SortingState>([]);

  /* Filters */
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>();
  const [dateTo, setDateTo] = React.useState<Date | undefined>();
  const [actorId, setActorId] = React.useState("");
  const [actionType, setActionType] = React.useState("");
  const [entityType, setEntityType] = React.useState("");

  const users = React.useMemo(() => getUsers(), []);

  const filters: AuditLogFilters = React.useMemo(() => {
    const f: AuditLogFilters = {};
    if (dateFrom) f.dateFrom = dateFrom.toISOString();
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      f.dateTo = end.toISOString();
    }
    if (actorId) f.actorId = actorId;
    if (actionType) f.actionType = actionType;
    if (entityType) f.entityType = entityType;
    return f;
  }, [dateFrom, dateTo, actorId, actionType, entityType]);

  const result = React.useMemo(
    () => getAuditLog(filters, page, PAGE_SIZE),
    [filters, page]
  );

  /* ─── URL page helpers ─── */
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

  function handleDateFrom(value: Date | undefined) {
    setDateFrom(value);
    resetPage();
  }

  function handleDateTo(value: Date | undefined) {
    setDateTo(value);
    resetPage();
  }

  function handleActorId(value: string) {
    setActorId(value);
    resetPage();
  }

  function handleActionType(value: string) {
    setActionType(value);
    resetPage();
  }

  function handleEntityType(value: string) {
    setEntityType(value);
    resetPage();
  }

  function resetFilters() {
    setDateFrom(undefined);
    setDateTo(undefined);
    setActorId("");
    setActionType("");
    setEntityType("");
    router.replace(pathname);
  }

  return (
    <AuditLogTable
      data={result.data}
      pagination={{
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      }}
      onPaginationChange={pushPage}
      sorting={sorting}
      onSortingChange={setSorting}
      onResetFilters={resetFilters}
      filterSlots={
        <>
          <FormField label="From">
            <DatePicker
              value={dateFrom}
              onChange={handleDateFrom}
              placeholder="Start date"
            />
          </FormField>
          <FormField label="To">
            <DatePicker
              value={dateTo}
              onChange={handleDateTo}
              placeholder="End date"
            />
          </FormField>
          <FormField label="Actor">
            <div className="w-full sm:w-44">
              <Select value={actorId} onValueChange={handleActorId}>
                <SelectTrigger>
                  <SelectValue placeholder="All actors" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormField>
          <FormField label="Action">
            <div className="w-full sm:w-36">
              <Select value={actionType} onValueChange={handleActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormField>
          <FormField label="Entity">
            <div className="w-full sm:w-40">
              <Select value={entityType} onValueChange={handleEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormField>
        </>
      }
    />
  );
}
