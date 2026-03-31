"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Music, Sparkles, Brain } from "lucide-react";
import Link from "next/link";

interface Counts {
  meditations: number;
  music: number;
  affirmations: number;
  programs: number;
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts>({
    meditations: 0,
    music: 0,
    affirmations: 0,
    programs: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [med, mus, aff, prog] = await Promise.all([
          getCountFromServer(collection(db, "meditations")),
          getCountFromServer(collection(db, "musicTracks")),
          getCountFromServer(collection(db, "affirmations")),
          getCountFromServer(collection(db, "programs")),
        ]);
        setCounts({
          meditations: med.data().count,
          music: mus.data().count,
          affirmations: aff.data().count,
          programs: prog.data().count,
        });
      } catch {
        // Firestore not configured yet — show zeros
      }
    }
    load();
  }, []);

  const cards = [
    {
      title: "Медитации",
      count: counts.meditations,
      icon: Headphones,
      href: "/meditations",
    },
    {
      title: "Музыка",
      count: counts.music,
      icon: Music,
      href: "/music",
    },
    {
      title: "Аффирмации",
      count: `${counts.affirmations} сфер`,
      icon: Sparkles,
      href: "/affirmations",
    },
    {
      title: "Программы",
      count: `${counts.programs} сфер`,
      icon: Brain,
      href: "/programs",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Панель управления</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                <c.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.count}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
