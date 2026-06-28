"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarTab } from "./CalendarTab";
import { PhotosTab } from "./PhotosTab";
import { QuotesTab } from "./QuotesTab";
import { AffirmationsTab } from "./AffirmationsTab";

export default function StoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Сторис</h1>
        <p className="text-sm text-muted-foreground">
          Ежедневные сторис: расписание на календаре + библиотеки контента.
        </p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Календарь</TabsTrigger>
          <TabsTrigger value="photos">Фото</TabsTrigger>
          <TabsTrigger value="quotes">Цитаты</TabsTrigger>
          <TabsTrigger value="affirmations">Аффирмации</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="pt-4">
          <CalendarTab />
        </TabsContent>
        <TabsContent value="photos" className="pt-4">
          <PhotosTab />
        </TabsContent>
        <TabsContent value="quotes" className="pt-4">
          <QuotesTab />
        </TabsContent>
        <TabsContent value="affirmations" className="pt-4">
          <AffirmationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
