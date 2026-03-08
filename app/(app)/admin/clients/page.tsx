"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { ClientsContent } from "./_components/clients-content";
import { SitesContent } from "./_components/sites-content";

function ClientsAndSitesContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("clients"));

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="sites">Sites</TabsTrigger>
      </TabsList>
      <TabsContent value="clients"><ClientsContent /></TabsContent>
      <TabsContent value="sites"><SitesContent /></TabsContent>
    </Tabs>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
      <ClientsAndSitesContent />
    </Suspense>
  );
}
