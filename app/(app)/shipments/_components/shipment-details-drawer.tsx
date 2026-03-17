"use client";

import * as React from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { shipmentsApi } from "@/lib/api-client";
import {
  useSites,
  useClients,
  useVendors,
  useWasteTypes,
  useTransporters,
  useReceivingFacilities,
  useContainerLocationsBySite,
  useShipmentLineItems,
  useShipmentExternalIdentifiers,
} from "@/lib/hooks/use-api-data";
import { useAuth } from "@/lib/auth-context";
import type {
  Shipment,
  ShipmentStatus,
  WeightUnit,
  CostBreakdown,
  ShipmentLineItem,
  ShipmentCostInternal,
  ShipmentCostCustomer,
  ShipmentExternalIdentifier,
} from "@/lib/types";

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
};

const wasteCategoryVariant: Record<string, BadgeVariant> = {
  "Non Haz": "neutral",
  "Hazardous Waste": "error",
  Recycling: "success",
  Medical: "warning",
  "E-Waste": "info",
};

interface ShipmentDetailsDrawerProps {
  shipment: Shipment | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function ShipmentDetailsDrawer({
  shipment,
  onClose,
  onDeleted,
  onUpdated,
}: ShipmentDetailsDrawerProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const canEditDelete =
    user?.role === "admin" ||
    user?.role === "manager" ||
    (shipment?.createdBy === user?.id);

  React.useEffect(() => {
    setIsEditing(false);
  }, [shipment?.id]);

  async function handleDelete() {
    if (!shipment) return;
    try {
      const result = await shipmentsApi.delete(shipment.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
        return;
      }
      toast.success("Shipment deleted", {
        description: `Shipment has been removed`,
      });
      onClose();
      onDeleted();
    } catch {
      toast.error("Failed to delete shipment");
    }
  }

  return (
    <>
      <Drawer
        open={shipment !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {isEditing ? "Edit Shipment" : "Shipment Details"}
            </DrawerTitle>
            {shipment && (
              <DrawerDescription>{shipment.id}</DrawerDescription>
            )}
          </DrawerHeader>

          {shipment && !isEditing && <ViewMode shipment={shipment} />}

          {shipment && isEditing && (
            <EditMode
              shipment={shipment}
              onSave={() => {
                setIsEditing(false);
                onUpdated();
              }}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {shipment && !isEditing && canEditDelete && (
            <DrawerFooter>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete shipment"
        description={`Are you sure you want to delete ${shipment?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ─── Section Header ─── */

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider pt-4 pb-1 border-t border-border-default mt-4 first:mt-0 first:border-0 first:pt-0">
      {title}
    </p>
  );
}

/* ─── Cost Table ─── */

function CostTable({ label, cost }: { label: string; cost?: CostBreakdown }) {
  if (!cost) return null;
  const total =
    cost.haulCharge +
    cost.disposalFeeTotal +
    cost.fuelFee +
    cost.environmentalFee +
    cost.otherFees -
    cost.rebate;

  const rows = [
    { name: "Haul Charge", value: cost.haulCharge },
    { name: "Disposal (each)", value: cost.disposalFeeEach },
    { name: "Disposal Total", value: cost.disposalFeeTotal },
    { name: "Fuel Fee", value: cost.fuelFee },
    { name: "Environmental Fee", value: cost.environmentalFee },
    { name: "Rebate", value: -cost.rebate },
    { name: "Other Fees", value: cost.otherFees },
  ].filter((r) => r.value !== 0);

  return (
    <div>
      <p className="text-xs font-medium text-text-muted mb-1.5">{label}</p>
      <div className="rounded-[var(--radius-sm)] border border-border-default overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-3 py-1.5 text-text-secondary">{r.name}</td>
                <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                  {r.value < 0 ? "-" : ""}$
                  {Math.abs(r.value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            <tr className="bg-bg-subtle">
              <td className="px-3 py-1.5 text-text-primary font-semibold">
                Total
              </td>
              <td className="px-3 py-1.5 text-right text-text-primary font-mono font-semibold">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── View Mode ─── */

function ViewMode({ shipment }: { shipment: Shipment }) {
  const { lineItems } = useShipmentLineItems(shipment.id);
  const { externalIdentifiers: externalIds } = useShipmentExternalIdentifiers(shipment.id);

  const mpsCostTotal = shipment.mpsCost
    ? shipment.mpsCost.haulCharge +
      shipment.mpsCost.disposalFeeTotal +
      shipment.mpsCost.fuelFee +
      shipment.mpsCost.environmentalFee +
      shipment.mpsCost.otherFees -
      shipment.mpsCost.rebate
    : 0;
  const custCostTotal = shipment.customerCost
    ? shipment.customerCost.haulCharge +
      shipment.customerCost.disposalFeeTotal +
      shipment.customerCost.fuelFee +
      shipment.customerCost.environmentalFee +
      shipment.customerCost.otherFees -
      shipment.customerCost.rebate
    : 0;
  const margin = custCostTotal - mpsCostTotal;
  const marginPct = custCostTotal > 0 ? (margin / custCostTotal) * 100 : 0;

  return (
    <DrawerBody>
      <div className="space-y-1">
        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={statusVariant[shipment.status]}>
            {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
          </Badge>
          {shipment.wasteCategory && (
            <Badge variant={wasteCategoryVariant[shipment.wasteCategory] ?? "neutral"}>
              {shipment.wasteCategory}
            </Badge>
          )}
        </div>

        {/* ─── Shipment Info ─── */}
        <SectionHeader title="Shipment Info" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <DetailField
            label="Date"
            value={shipment.shipmentDate ? format(new Date(shipment.shipmentDate + "T00:00:00"), "MMM d, yyyy") : "—"}
          />
          <DetailField label="Site" value={shipment.siteName} />
          <DetailField label="Client" value={shipment.clientName} />
          <DetailField label="Vendor" value={shipment.vendorName} />
          <DetailField
            label="Weight"
            value={shipment.weightValue != null ? `${shipment.weightValue.toLocaleString()} ${shipment.weightUnit ?? ""}` : "—"}
          />
          {shipment.manifestNumber && (
            <DetailField label="Manifest #" value={shipment.manifestNumber} mono />
          )}
          {shipment.returnManifestDate && (
            <DetailField
              label="Return Manifest"
              value={format(new Date(shipment.returnManifestDate + "T00:00:00"), "MMM d, yyyy")}
            />
          )}
          {shipment.profileNumber && (
            <DetailField label="Profile #" value={shipment.profileNumber} mono />
          )}
        </div>

        {/* ─── Classification ─── */}
        {(shipment.treatmentMethod ||
          shipment.wasteCodes ||
          shipment.sourceCode ||
          shipment.containerType ||
          shipment.serviceFrequency) && (
          <>
            <SectionHeader title="Classification" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {shipment.wasteTypeName && (
                <DetailField label="Waste Type" value={shipment.wasteTypeName} />
              )}
              {shipment.treatmentMethod && (
                <DetailField label="Treatment Method" value={shipment.treatmentMethod} />
              )}
              {shipment.wasteCodes && (
                <DetailField label="Waste Codes" value={shipment.wasteCodes} mono />
              )}
              {shipment.sourceCode && (
                <DetailField label="Source Code" value={shipment.sourceCode} mono />
              )}
              {shipment.formCode && (
                <DetailField label="Form Code" value={shipment.formCode} mono />
              )}
              {shipment.treatmentCode && (
                <DetailField label="Treatment Code" value={shipment.treatmentCode} mono />
              )}
              {shipment.ewcNumber && (
                <DetailField label="EWC Number" value={shipment.ewcNumber} mono />
              )}
              {shipment.containerType && (
                <DetailField label="Container" value={shipment.containerType} />
              )}
              {shipment.containerLocation && (
                <DetailField label="Container Location" value={shipment.containerLocation} />
              )}
              {shipment.serviceFrequency && (
                <DetailField label="Service Frequency" value={shipment.serviceFrequency} />
              )}
            </div>
          </>
        )}

        {/* ─── Volume / Weight Details ─── */}
        {(shipment.standardizedVolumeLbs ||
          shipment.targetLoadWeight ||
          shipment.qty) && (
          <>
            <SectionHeader title="Volume Details" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {shipment.qty != null && shipment.unit && (
                <DetailField label="Quantity" value={`${shipment.qty} ${shipment.unit}`} />
              )}
              {shipment.weightPerUnit != null && (
                <DetailField label="Weight/Unit" value={`${shipment.weightPerUnit.toLocaleString()} lbs`} />
              )}
              {shipment.standardizedVolumeLbs != null && (
                <DetailField label="Std. Volume (lbs)" value={shipment.standardizedVolumeLbs.toLocaleString()} />
              )}
              {shipment.standardizedVolumeKg != null && (
                <DetailField label="Std. Volume (kg)" value={shipment.standardizedVolumeKg.toLocaleString()} />
              )}
              {shipment.targetLoadWeight != null && (
                <DetailField label="Target Load" value={`${shipment.targetLoadWeight.toLocaleString()} lbs`} />
              )}
            </div>
          </>
        )}

        {/* ─── Logistics ─── */}
        {(shipment.receivingFacility ||
          shipment.transporterName) && (
          <>
            <SectionHeader title="Logistics" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {shipment.receivingCompany && (
                <DetailField label="Receiving Company" value={shipment.receivingCompany} />
              )}
              {shipment.receivingFacility && (
                <DetailField label="Receiving Facility" value={shipment.receivingFacility} />
              )}
              {shipment.receivingCity && shipment.receivingState && (
                <DetailField
                  label="Facility Location"
                  value={`${shipment.receivingCity}, ${shipment.receivingState}`}
                />
              )}
              {shipment.receivingEpaId && (
                <DetailField label="EPA ID" value={shipment.receivingEpaId} mono />
              )}
              {shipment.milesFromFacility != null && (
                <DetailField label="Miles" value={`${shipment.milesFromFacility} mi`} />
              )}
              {shipment.transporterName && (
                <DetailField label="Transporter" value={shipment.transporterName} />
              )}
            </div>
          </>
        )}

        {/* ─── MPS Cost ─── */}
        {shipment.mpsCost && (
          <>
            <SectionHeader title="Cost Breakdown" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CostTable label="MPS Cost" cost={shipment.mpsCost} />
              <CostTable label="Customer Cost" cost={shipment.customerCost} />
            </div>
            {/* Margin */}
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-bg-subtle px-3 py-2 mt-2">
              <span className="text-sm font-medium text-text-primary">Margin</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-text-primary">
                  ${margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge variant={margin >= 0 ? "success" : "error"}>
                  {marginPct.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* ─── Line Items ─── */}
        {lineItems.length > 0 && (
          <>
            <SectionHeader title={`Line Items (${lineItems.length})`} />
            <div className="rounded-[var(--radius-sm)] border border-border-default overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-bg-subtle">
                    <th className="px-3 py-2 text-left font-medium text-text-muted">#</th>
                    <th className="px-3 py-2 text-left font-medium text-text-muted">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-text-muted">Weight (lbs)</th>
                    <th className="px-3 py-2 text-right font-medium text-text-muted">Weight (kg)</th>
                    <th className="px-3 py-2 text-right font-medium text-text-muted">Target (lbs)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-border-default last:border-0">
                      <td className="px-3 py-1.5 text-text-muted">{li.lineNumber}</td>
                      <td className="px-3 py-1.5 text-text-primary">
                        {li.quantityValue} {li.unitId}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {li.standardizedWeightLb?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {li.standardizedWeightKg?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {li.targetLoadWeightLb?.toLocaleString() ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─── External Identifiers ─── */}
        {externalIds.length > 0 && (
          <>
            <SectionHeader title="External Identifiers" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {externalIds.map((eid) => (
                <DetailField
                  key={eid.id}
                  label={eid.identifierType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={eid.identifierValue}
                  mono
                />
              ))}
            </div>
          </>
        )}

        {/* ─── Notes ─── */}
        {shipment.notes && (
          <div className="pt-3">
            <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-primary">{shipment.notes}</p>
          </div>
        )}

        {/* ─── Audit ─── */}
        <div className="border-t border-border-default pt-4 mt-4 space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Audit
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-500">
              {(shipment.createdByName ?? "U")
                .split(" ")
                .map((n) => n[0] ?? "")
                .join("") || "?"}
            </div>
            <span className="text-text-primary">{shipment.createdByName ?? "Unknown"}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>Created: {shipment.createdAt ? format(new Date(shipment.createdAt), "MMM d, yyyy h:mm a") : "—"}</span>
            <span>Updated: {shipment.updatedAt ? format(new Date(shipment.updatedAt), "MMM d, yyyy h:mm a") : "—"}</span>
          </div>
        </div>
      </div>
    </DrawerBody>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`text-text-primary mt-0.5 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/* ─── Edit Mode ─── */

function EditMode({
  shipment,
  onSave,
  onCancel,
}: {
  shipment: Shipment;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { sites } = useSites();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { wasteTypes } = useWasteTypes();
  const { transporters } = useTransporters();
  const { facilities } = useReceivingFacilities();
  const { containerLocations } = useContainerLocationsBySite(shipment.siteId);

  const [form, setForm] = React.useState({
    siteId: shipment.siteId,
    clientId: shipment.clientId,
    vendorId: shipment.vendorId,
    wasteTypeId: shipment.wasteTypeId,
    shipmentDate: shipment.shipmentDate ? new Date(shipment.shipmentDate + "T00:00:00") : new Date(),
    weightValue: shipment.weightValue,
    weightUnit: shipment.weightUnit as string,
    volumeValue: shipment.volumeValue ?? null,
    notes: shipment.notes ?? "",
    status: shipment.status as string,
    manifestNumber: shipment.manifestNumber ?? "",
    transporterName: shipment.transporterName ?? "",
    receivingFacility: shipment.receivingFacility ?? "",
    treatmentMethod: shipment.treatmentMethod ?? "",
    wasteCategory: shipment.wasteCategory ?? "",
    serviceFrequency: shipment.serviceFrequency ?? "",
    containerLocation: shipment.containerLocation ?? "",
    profileNumber: shipment.profileNumber ?? "",
  });

  async function handleSave() {
    try {
      // Only include fields that have values - undefined fields will be filtered on backend
      const updateData: Record<string, unknown> = {
        site_id: form.siteId || undefined,
        customer_id: form.clientId || undefined,
        vendor_id: form.vendorId || undefined,
        waste_type_id: form.wasteTypeId || undefined,
        shipment_date: format(form.shipmentDate, "yyyy-MM-dd"),
        quantity: form.weightValue,
        quantity_unit: form.weightUnit,
        notes: form.notes || undefined,
        status: form.status,
        manifest_number: form.manifestNumber || undefined,
        carrier_name: form.transporterName || undefined,
        facility_name: form.receivingFacility || undefined,
        treatment_method: form.treatmentMethod || undefined,
        waste_category: form.wasteCategory || undefined,
      };

      // Only add FK fields if they have valid values
      if (form.serviceFrequency) updateData.service_frequency_id = form.serviceFrequency;
      if (form.containerLocation) updateData.container_location_id = form.containerLocation;
      if (form.profileNumber) updateData.profile_id = form.profileNumber;

      const result = await shipmentsApi.update(shipment.id, updateData);
      if (result.error) {
        toast.error("Failed to update", { description: result.error });
        return;
      }
      toast.success("Shipment updated", {
        description: `Shipment has been saved`,
      });
      onSave();
    } catch {
      toast.error("Failed to update shipment");
    }
  }

  const TREATMENT_METHODS = [
    "Landfill", "Incineration", "Recycling", "Reuse", "Fuel Blending",
    "Wastewater Treatment", "Stabilization", "Deep Well Injection",
  ];
  const WASTE_CATEGORIES = [
    "Non Haz", "Hazardous Waste", "Recycling", "C&D", "E-Waste",
    "Medical", "Universal", "Used Oil", "Antifreeze", "Tires", "Lamps/Ballasts",
  ];
  const SERVICE_FREQUENCIES = [
    "On Call", "Weekly", "Bi-Weekly", "Monthly", "Quarterly",
    "Semi-Annual", "Annual", "One Time", "As Needed",
  ];

  return (
    <>
      <DrawerBody>
        <div className="space-y-4">
          <FormField label="Site" required>
            <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v, containerLocation: "" })}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Client">
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Vendor" required>
              <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Waste Type" required>
              <Select value={form.wasteTypeId} onValueChange={(v) => setForm({ ...form, wasteTypeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {wasteTypes.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date" required>
              <DatePicker
                value={form.shipmentDate}
                onChange={(d) => d && setForm({ ...form, shipmentDate: d })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Weight" required>
              <NumberInput
                value={form.weightValue}
                onChange={(e) => setForm({ ...form, weightValue: Number(e.target.value) })}
                min={0}
              />
            </FormField>
            <FormField label="Unit" required>
              <Select value={form.weightUnit} onValueChange={(v) => setForm({ ...form, weightUnit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* ─── Classification ─── */}
          <div className="border-t border-border-default pt-3 mt-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Classification
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Waste Category">
              <Select value={form.wasteCategory || "none"} onValueChange={(v) => setForm({ ...form, wasteCategory: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {WASTE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Treatment Method">
              <Select value={form.treatmentMethod || "none"} onValueChange={(v) => setForm({ ...form, treatmentMethod: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {TREATMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Service Frequency">
              <Select value={form.serviceFrequency || "none"} onValueChange={(v) => setForm({ ...form, serviceFrequency: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {SERVICE_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Container Location">
              <Select value={form.containerLocation || "none"} onValueChange={(v) => setForm({ ...form, containerLocation: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {containerLocations.map((cl) => (
                    <SelectItem key={cl.id} value={cl.locationName}>{cl.locationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* ─── Logistics ─── */}
          <div className="border-t border-border-default pt-3 mt-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Logistics
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Manifest #">
              <TextInput
                value={form.manifestNumber}
                onChange={(e) => setForm({ ...form, manifestNumber: e.target.value })}
                placeholder="e.g. 012345678ABC"
              />
            </FormField>
            <FormField label="Profile #">
              <TextInput
                value={form.profileNumber}
                onChange={(e) => setForm({ ...form, profileNumber: e.target.value })}
                placeholder="e.g. P-001"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Transporter">
              <Select value={form.transporterName || "none"} onValueChange={(v) => setForm({ ...form, transporterName: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {transporters.map((t) => (
                    <SelectItem key={t.id} value={t.transporterName}>{t.transporterName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Receiving Facility">
              <Select value={form.receivingFacility || "none"} onValueChange={(v) => setForm({ ...form, receivingFacility: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.facilityName}>{f.facilityName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              rows={3}
            />
          </FormField>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DrawerFooter>
    </>
  );
}
