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
import {
  getSites,
  getClients,
  getVendors,
  getWasteTypes,
  updateShipment,
  deleteShipment,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { Shipment, ShipmentStatus, WeightUnit } from "@/lib/types";

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
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

  /* site_user can only edit/delete their own shipments */
  const canEditDelete =
    user?.role === "admin" ||
    user?.role === "system_admin" ||
    (user?.role === "site_user" && shipment?.createdBy === user?.id);

  /* Reset edit mode when shipment changes */
  React.useEffect(() => {
    setIsEditing(false);
  }, [shipment?.id]);

  function handleDelete() {
    if (!shipment) return;
    deleteShipment(shipment.id);
    toast.success("Shipment deleted", {
      description: `${shipment.id} has been removed`,
    });
    onClose();
    onDeleted();
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

          {shipment && !isEditing && (
            <ViewMode shipment={shipment} />
          )}

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

/* ─── View Mode ─── */

function ViewMode({ shipment }: { shipment: Shipment }) {
  return (
    <DrawerBody>
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[shipment.status]}>
            {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
          </Badge>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <DetailField label="Date" value={
            format(new Date(shipment.shipmentDate + "T00:00:00"), "MMM d, yyyy")
          } />
          <DetailField label="Site" value={shipment.siteName} />
          <DetailField label="Client" value={shipment.clientName} />
          <DetailField label="Vendor" value={shipment.vendorName} />
          <DetailField label="Waste Type" value={shipment.wasteTypeName} />
          <DetailField
            label="Weight"
            value={`${shipment.weightValue.toLocaleString()} ${shipment.weightUnit}`}
          />
          {shipment.volumeValue != null && (
            <DetailField
              label="Volume"
              value={`${shipment.volumeValue} ${shipment.volumeUnit ?? ""}`}
            />
          )}
        </div>

        {/* Notes */}
        {shipment.notes && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-primary">{shipment.notes}</p>
          </div>
        )}

        {/* Audit info */}
        <div className="border-t border-border-default pt-4 space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Audit
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-500">
              {shipment.createdByName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span className="text-text-primary">{shipment.createdByName}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>Created: {format(new Date(shipment.createdAt), "MMM d, yyyy h:mm a")}</span>
            <span>Updated: {format(new Date(shipment.updatedAt), "MMM d, yyyy h:mm a")}</span>
          </div>
        </div>
      </div>
    </DrawerBody>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="text-text-primary mt-0.5">{value}</p>
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
  const sites = React.useMemo(() => getSites(), []);
  const clients = React.useMemo(() => getClients(), []);
  const vendors = React.useMemo(() => getVendors(), []);
  const wasteTypes = React.useMemo(() => getWasteTypes(), []);

  const [form, setForm] = React.useState({
    siteId: shipment.siteId,
    clientId: shipment.clientId,
    vendorId: shipment.vendorId,
    wasteTypeId: shipment.wasteTypeId,
    shipmentDate: new Date(shipment.shipmentDate + "T00:00:00"),
    weightValue: shipment.weightValue,
    weightUnit: shipment.weightUnit as string,
    volumeValue: shipment.volumeValue ?? null,
    notes: shipment.notes ?? "",
    status: shipment.status as string,
  });

  function handleSave() {
    updateShipment(shipment.id, {
      siteId: form.siteId,
      clientId: form.clientId,
      vendorId: form.vendorId,
      wasteTypeId: form.wasteTypeId,
      shipmentDate: form.shipmentDate.toISOString().split("T")[0],
      weightValue: form.weightValue,
      weightUnit: form.weightUnit as WeightUnit,
      volumeValue: form.volumeValue ?? undefined,
      notes: form.notes || undefined,
      status: form.status as ShipmentStatus,
    });
    toast.success("Shipment updated", {
      description: `${shipment.id} has been saved`,
    });
    onSave();
  }

  return (
    <>
      <DrawerBody>
        <div className="space-y-4">
          <FormField label="Site" required>
            <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v })}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

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

          <FormField label="Waste Type" required>
            <Select value={form.wasteTypeId} onValueChange={(v) => setForm({ ...form, wasteTypeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select waste type" /></SelectTrigger>
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <FormField label="Volume">
            <NumberInput
              value={form.volumeValue ?? ""}
              onChange={(e) => setForm({ ...form, volumeValue: e.target.value ? Number(e.target.value) : null })}
              min={0}
              placeholder="Optional"
            />
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
