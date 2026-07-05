"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, Plus, X, Search, ChevronDown, ChevronRight } from "lucide-react";

// Screen groups, in app order. A key belongs to the first matching prefix.
const GROUPS: { prefix: string; title: string }[] = [
  { prefix: "nav_", title: "Нижняя навигация" },
  { prefix: "home_", title: "Главная" },
  { prefix: "story_", title: "Сторис" },
  { prefix: "thinking_", title: "Мышление" },
  { prefix: "state_", title: "Мышление — экран состояния" },
  { prefix: "practices_", title: "Практики" },
  { prefix: "meditations_", title: "Медитации" },
  { prefix: "affirmations_", title: "Аффирмации" },
  { prefix: "webinars_", title: "Вебинары" },
  { prefix: "player_", title: "Плеер" },
  { prefix: "clubs_", title: "Клуб" },
  { prefix: "school_", title: "О школе" },
];

const OTHER_GROUP = "Прочее (старые ключи)";

function groupOf(key: string): string {
  const g = GROUPS.find((g) => key.startsWith(g.prefix));
  return g ? g.title : OTHER_GROUP;
}

export default function UIStringsPage() {
  const [strings, setStrings] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    [OTHER_GROUP]: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "config", "ui_strings"));
        if (snap.exists()) {
          setStrings(snap.data() as Record<string, string>);
        }
      } catch {
        // not configured yet
      }
    }
    load();
  }, []);

  function updateString(key: string, value: string) {
    setStrings({ ...strings, [key]: value });
  }

  function removeString(key: string) {
    const next = { ...strings };
    delete next[key];
    setStrings(next);
  }

  function addString() {
    if (newKey.trim()) {
      setStrings({ ...strings, [newKey.trim()]: newValue });
      setNewKey("");
      setNewValue("");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "ui_strings"), strings);
    } finally {
      setSaving(false);
    }
  }

  const filtered = Object.entries(strings).filter(
    ([k, v]) =>
      k.toLowerCase().includes(filter.toLowerCase()) ||
      v.toLowerCase().includes(filter.toLowerCase())
  );

  const groupTitles = [...GROUPS.map((g) => g.title), OTHER_GROUP];
  const grouped = new Map<string, [string, string][]>();
  for (const [k, v] of filtered) {
    const g = groupOf(k);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push([k, v]);
  }
  grouped.forEach((entries) => entries.sort(([a], [b]) => a.localeCompare(b)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">UI тексты</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ключу или значению..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Новый ключ"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Значение"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={addString}>
          <Plus className="size-4" />
        </Button>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {filter ? "Ничего не найдено" : "Нет UI текстов. Запустите seed-скрипт."}
        </p>
      )}

      {groupTitles
        .filter((g) => grouped.has(g))
        .map((groupTitle) => {
          const entries = grouped.get(groupTitle)!;
          // Auto-expand everything while searching.
          const isCollapsed = !filter && collapsed[groupTitle];
          return (
            <div key={groupTitle} className="space-y-2">
              <button
                className="flex w-full items-center gap-2 text-left"
                onClick={() =>
                  setCollapsed({ ...collapsed, [groupTitle]: !collapsed[groupTitle] })
                }>
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <h2 className="text-lg font-semibold">{groupTitle}</h2>
                <Badge variant="outline">{entries.length}</Badge>
              </button>
              {!isCollapsed && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Ключ</TableHead>
                      <TableHead>Значение</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs align-top pt-4">
                          {key}
                        </TableCell>
                        <TableCell>
                          {value.length > 80 ? (
                            <Textarea
                              value={value}
                              rows={3}
                              onChange={(e) => updateString(key, e.target.value)}
                            />
                          ) : (
                            <Input
                              value={value}
                              onChange={(e) => updateString(key, e.target.value)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="align-top pt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeString(key)}
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          );
        })}
    </div>
  );
}
