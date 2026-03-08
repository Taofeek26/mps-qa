"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { ReceivingFacilitiesContent } from "./_components/receiving-facilities-content";
import { TransportersContent } from "./_components/transporters-content";

function FacilitiesAndTransportContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("receiving-facilities"));

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="receiving-facilities">Receiving Facilities</TabsTrigger>
        <TabsTrigger value="transporters">Transporters</TabsTrigger>
      </TabsList>
      <TabsContent value="receiving-facilities"><ReceivingFacilitiesContent /></TabsContent>
      <TabsContent value="transporters"><TransportersContent /></TabsContent>
    </Tabs>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
      <FacilitiesAndTransportContent />
    </Suspense>
  );
}
