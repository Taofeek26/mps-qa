"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { CrudTable } from "@/components/patterns/crud-table";
import { customerSurveysApi } from "@/lib/api-client";
import { useCustomerSurveys, useClients } from "@/lib/hooks/use-api-data";
import type { CustomerSurvey } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const COMPLAINT_CATEGORIES = ["Service Quality", "Timeliness", "Billing", "Communication", "Other"];

function getCsatVariant(csat: number): BadgeVariant {
  if (csat >= 4.5) return "success";
  if (csat >= 3.5) return "info";
  if (csat >= 2.5) return "warning";
  return "error";
}

function getNpsVariant(nps: number): BadgeVariant {
  if (nps >= 9) return "success";
  if (nps >= 7) return "info";
  if (nps >= 5) return "warning";
  return "error";
}

/* ─── Columns ─── */

const columns: ColumnDef<CustomerSurvey, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
    size: 120,
    cell: ({ getValue }) => {
      const dateStr = getValue() as string;
      if (!dateStr) return <span className="text-text-muted">—</span>;
      return format(new Date(dateStr), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "clientName",
    header: "Client",
    size: 180,
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{(getValue() as string) || "—"}</span>
    ),
  },
  {
    accessorKey: "csat",
    header: "CSAT",
    size: 80,
    cell: ({ getValue }) => {
      const csat = getValue() as number;
      return <Badge variant={getCsatVariant(csat)}>{csat.toFixed(1)}</Badge>;
    },
  },
  {
    accessorKey: "nps",
    header: "NPS",
    size: 70,
    cell: ({ getValue }) => {
      const nps = getValue() as number;
      return <Badge variant={getNpsVariant(nps)}>{nps}</Badge>;
    },
  },
  {
    accessorKey: "fcrResolved",
    header: "FCR",
    size: 80,
    cell: ({ getValue }) => {
      const fcr = getValue() as boolean;
      return (
        <Badge variant={fcr ? "success" : "warning"}>
          {fcr ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "responseTimeHrs",
    header: "Response",
    size: 100,
    cell: ({ getValue }) => {
      const hrs = getValue() as number;
      return <span className="text-text-secondary">{hrs.toFixed(1)}h</span>;
    },
  },
  {
    accessorKey: "hasComplaint",
    header: "Complaint",
    size: 100,
    cell: ({ getValue }) => {
      const hasComplaint = getValue() as boolean;
      return (
        <Badge variant={hasComplaint ? "error" : "success"}>
          {hasComplaint ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "complaintCategory",
    header: "Category",
    size: 130,
    cell: ({ getValue }) => {
      const cat = getValue() as string | undefined;
      if (!cat) return <span className="text-text-muted">—</span>;
      return <span className="text-text-secondary">{cat}</span>;
    },
  },
];

/* ─── Form ─── */

function CustomerSurveyForm({
  item,
  onClose,
  onSaved,
  clients,
}: {
  item: CustomerSurvey | null;
  onClose: () => void;
  onSaved: () => void;
  clients: { id: string; name: string }[];
}) {
  const [clientId, setClientId] = React.useState(item?.clientId ?? "");
  const [date, setDate] = React.useState(item?.date ?? "");
  const [csat, setCsat] = React.useState(String(item?.csat ?? "4.0"));
  const [nps, setNps] = React.useState(String(item?.nps ?? "8"));
  const [fcrResolved, setFcrResolved] = React.useState(item?.fcrResolved ?? true);
  const [responseTimeHrs, setResponseTimeHrs] = React.useState(String(item?.responseTimeHrs ?? "2"));
  const [hasComplaint, setHasComplaint] = React.useState(item?.hasComplaint ?? false);
  const [complaintCategory, setComplaintCategory] = React.useState(item?.complaintCategory ?? "");
  const [feedback, setFeedback] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = "Client is required";
    if (!date) errs.date = "Date is required";
    const csatNum = parseFloat(csat);
    if (isNaN(csatNum) || csatNum < 1 || csatNum > 5) errs.csat = "CSAT must be between 1.0 and 5.0";
    const npsNum = parseInt(nps, 10);
    if (isNaN(npsNum) || npsNum < 0 || npsNum > 10) errs.nps = "NPS must be between 0 and 10";
    const respNum = parseFloat(responseTimeHrs);
    if (isNaN(respNum) || respNum < 0) errs.responseTimeHrs = "Response time must be non-negative";
    if (hasComplaint && !complaintCategory) errs.complaintCategory = "Category is required for complaints";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      client_id: clientId,
      date,
      csat: csatNum,
      nps: npsNum,
      fcr_resolved: fcrResolved,
      response_time_hrs: respNum,
      has_complaint: hasComplaint,
      complaint_category: hasComplaint ? complaintCategory : undefined,
      feedback: feedback.trim() || undefined,
    };

    setSaving(true);
    try {
      if (item) {
        const result = await customerSurveysApi.update(item.id, data);
        if (result.error) {
          toast.error("Failed to update", { description: result.error });
          return;
        }
        toast.success("Survey updated");
      } else {
        const result = await customerSurveysApi.create(data);
        if (result.error) {
          toast.error("Failed to create", { description: result.error });
          return;
        }
        toast.success("Survey created");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <FormField label="Date" required error={errors.date}>
          <DatePicker
            value={date ? new Date(date + "T00:00:00") : undefined}
            onChange={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Select date"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="CSAT (1-5)" required error={errors.csat}>
          <TextInput
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={csat}
            onChange={(e) => setCsat(e.target.value)}
            placeholder="4.0"
            error={!!errors.csat}
          />
        </FormField>
        <FormField label="NPS (0-10)" required error={errors.nps}>
          <TextInput
            type="number"
            min="0"
            max="10"
            value={nps}
            onChange={(e) => setNps(e.target.value)}
            placeholder="8"
            error={!!errors.nps}
          />
        </FormField>
        <FormField label="Response Time (hrs)" required error={errors.responseTimeHrs}>
          <TextInput
            type="number"
            min="0"
            step="0.5"
            value={responseTimeHrs}
            onChange={(e) => setResponseTimeHrs(e.target.value)}
            placeholder="2.0"
            error={!!errors.responseTimeHrs}
          />
        </FormField>
      </div>

      <FormField label="First Contact Resolution (FCR)">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={fcrResolved} onCheckedChange={setFcrResolved} />
          <span className="text-sm text-text-secondary">
            {fcrResolved ? "Issue resolved on first contact" : "Required follow-up"}
          </span>
        </div>
      </FormField>

      <div className="border-t border-border-default pt-4 mt-2">
        <p className="text-sm font-medium text-text-primary mb-3">Complaint Information</p>
      </div>

      <FormField label="Has Complaint">
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={hasComplaint} onCheckedChange={setHasComplaint} />
          <span className="text-sm text-text-secondary">
            {hasComplaint ? "Yes" : "No"}
          </span>
        </div>
      </FormField>

      {hasComplaint && (
        <FormField label="Complaint Category" required error={errors.complaintCategory}>
          <Select value={complaintCategory} onValueChange={setComplaintCategory}>
            <SelectTrigger error={!!errors.complaintCategory}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {COMPLAINT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField label="Feedback">
        <TextInput
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Additional feedback..."
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : item ? "Save Changes" : "Create Survey"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function CustomerSurveysPage() {
  return (
    <React.Suspense fallback={null}>
      <CustomerSurveysContent />
    </React.Suspense>
  );
}

function CustomerSurveysContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [search, setSearch] = React.useState("");
  const [complaintFilter, setComplaintFilter] = React.useState("");

  // Fetch data from API
  const { customerSurveys: allData, loading, refetch } = useCustomerSurveys();
  const { clients } = useClients();

  const filtered = React.useMemo(() => {
    let result = allData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.clientName?.toLowerCase().includes(q)
      );
    }
    if (complaintFilter) {
      result = result.filter((v) =>
        complaintFilter === "with-complaint" ? v.hasComplaint : !v.hasComplaint
      );
    }
    return result;
  }, [allData, search, complaintFilter]);

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

  async function handleDelete(item: CustomerSurvey) {
    try {
      const result = await customerSurveysApi.delete(item.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Survey deleted");
      refetch();
    } catch {
      toast.error("Failed to delete survey");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function resetFilters() {
    setSearch("");
    setComplaintFilter("");
    router.replace(pathname);
  }

  return (
    <div ref={tableRef}>
      <CrudTable<CustomerSurvey>
        title="Customer Surveys"
        subtitle={`${filtered.length} surveys`}
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
        searchPlaceholder="Search surveys..."
        onResetFilters={resetFilters}
        filterSlots={
          <div className="w-full sm:w-44">
            <Select value={complaintFilter} onValueChange={(v) => { setComplaintFilter(v); resetPage(); }}>
              <SelectTrigger>
                <SelectValue placeholder="All surveys" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="with-complaint">With Complaint</SelectItem>
                <SelectItem value="no-complaint">No Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        entityName="Survey"
        getItemLabel={(item) => `${item.clientName} - ${item.date}`}
        onDelete={handleDelete}
        emptyIcon={<MessageSquare className="h-10 w-10" />}
        emptyTitle="No surveys"
        emptyDescription="No customer surveys yet. Add a new survey to track customer feedback."
        loading={loading}
        formContent={({ item, onClose }) => (
          <CustomerSurveyForm
            item={item}
            onClose={onClose}
            onSaved={refetch}
            clients={clients}
          />
        )}
      />
    </div>
  );
}
