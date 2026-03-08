"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { WasteTypesContent } from "./_components/waste-types-content";
import { ServiceItemsContent } from "./_components/service-items-content";
import { ContainersContent } from "./_components/containers-content";
import { ProfilesContent } from "./_components/profiles-content";

function ReferenceDataContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("waste-types"));

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="waste-types">Waste Types</TabsTrigger>
        <TabsTrigger value="service-items">Service Items</TabsTrigger>
        <TabsTrigger value="containers">Containers</TabsTrigger>
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
      </TabsList>
      <TabsContent value="waste-types"><WasteTypesContent /></TabsContent>
      <TabsContent value="service-items"><ServiceItemsContent /></TabsContent>
      <TabsContent value="containers"><ContainersContent /></TabsContent>
      <TabsContent value="profiles"><ProfilesContent /></TabsContent>
    </Tabs>
  );
}

export default function ReferenceDataPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
      <ReferenceDataContent />
    </Suspense>
  );
}
