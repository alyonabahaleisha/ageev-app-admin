"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LIFE_AREAS,
  LifeAreaDoc,
  AREA_LABELS,
  LifeArea,
  MeditationDoc,
  WebinarDoc,
  BreakfastDoc,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Save,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Headphones,
  Coffee,
  Video,
  X,
} from "lucide-react";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .split("")
    .map((c) => (c in TRANSLIT ? TRANSLIT[c] : c))
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type ContentItem = { id: string; title: string; area?: string };

const emptyNewArea = { key: "", label: "", emoji: "", color: "#888888" };

export default function LifeAreasPage() {
  const [areas, setAreas] = useState<Record<string, LifeAreaDoc>>({});
  const [meditations, setMeditations] = useState<MeditationDoc[]>([]);
  const [webinars, setWebinars] = useState<WebinarDoc[]>([]);
  const [breakfasts, setBreakfasts] = useState<BreakfastDoc[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newArea, setNewArea] = useState(emptyNewArea);
  const [keyEdited, setKeyEdited] = useState(false);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "lifeAreas"), (snap) => {
        const data: Record<string, LifeAreaDoc> = {};
        snap.docs.forEach((d) => {
          data[d.id] = d.data() as LifeAreaDoc;
        });
        setAreas(data);
      }),
      onSnapshot(query(collection(db, "meditations"), orderBy("sortOrder")), (snap) =>
        setMeditations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MeditationDoc)))
      ),
      onSnapshot(query(collection(db, "webinars"), orderBy("sortOrder")), (snap) =>
        setWebinars(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebinarDoc)))
      ),
      onSnapshot(query(collection(db, "breakfasts"), orderBy("sortOrder")), (snap) =>
        setBreakfasts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BreakfastDoc)))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Union of the built-in keys and whatever exists in Firestore, ordered.
  const areaKeys = useMemo(() => {
    const keys = new Set<string>([...LIFE_AREAS, ...Object.keys(areas)]);
    return [...keys].sort(
      (a, b) => (areas[a]?.sortOrder ?? 999) - (areas[b]?.sortOrder ?? 999)
    );
  }, [areas]);

  const areaLabel = (key: string) =>
    areas[key]?.label ||
    AREA_LABELS[key as LifeArea] ||
    key;

  function updateArea(key: string, field: keyof LifeAreaDoc, value: string | number) {
    const base: LifeAreaDoc = areas[key] ?? {
      label: "",
      emoji: "",
      color: "",
      sortOrder: 0,
    };
    setAreas({
      ...areas,
      [key]: { ...base, [field]: value },
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(areas).map(([key, data]) =>
          setDoc(doc(db, "lifeAreas", key), data)
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddArea() {
    const key = newArea.key.trim();
    if (!key || !newArea.label.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "lifeAreas", key), {
        label: newArea.label.trim(),
        emoji: newArea.emoji.trim(),
        color: newArea.color,
        sortOrder: areaKeys.length,
      });
      setAddOpen(false);
      setNewArea(emptyNewArea);
      setKeyEdited(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteArea(key: string) {
    if (
      confirm(
        `Удалить сферу «${areaLabel(key)}»? Контент не удаляется, но остаётся без сферы.`
      )
    ) {
      await deleteDoc(doc(db, "lifeAreas", key));
    }
  }

  async function assignItem(col: string, id: string, areaKey: string) {
    await updateDoc(doc(db, col, id), { area: areaKey });
  }

  async function unassignItem(col: string, id: string) {
    await updateDoc(doc(db, col, id), { area: "" });
  }

  function contentFor(key: string) {
    return [
      {
        col: "meditations",
        title: "Медитации",
        icon: Headphones,
        items: meditations as ContentItem[],
      },
      {
        col: "breakfasts",
        title: "Духовные завтраки",
        icon: Coffee,
        items: breakfasts as ContentItem[],
      },
      {
        col: "webinars",
        title: "Вебинары",
        icon: Video,
        items: webinars as ContentItem[],
      },
    ].map((section) => ({
      ...section,
      assigned: section.items.filter((i) => i.area === key),
      available: section.items.filter((i) => i.area !== key),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Сферы жизни</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-4 mr-2" />
            Добавить сферу
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4 mr-2" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Ключ</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="w-16">Порядок</TableHead>
            <TableHead>Контент</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {areaKeys.map((key) => {
            const area = areas[key] || {
              label: "",
              emoji: "",
              color: "",
              sortOrder: 0,
            };
            const isOpen = expanded === key;
            const sections = contentFor(key);
            const isBuiltIn = (LIFE_AREAS as readonly string[]).includes(key);
            return (
              <Fragment key={key}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpanded(isOpen ? null : key)}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{key}</TableCell>
                  <TableCell>
                    <Input
                      value={area.label}
                      onChange={(e) => updateArea(key, "label", e.target.value)}
                      className="max-w-48"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={area.sortOrder}
                      onChange={(e) =>
                        updateArea(key, "sortOrder", parseInt(e.target.value) || 0)
                      }
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {sections.map((s) => (
                        <Badge
                          key={s.col}
                          variant={s.assigned.length ? "secondary" : "outline"}
                          className="gap-1"
                        >
                          <s.icon className="size-3" />
                          {s.assigned.length}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!isBuiltIn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteArea(key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/40 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sections.map((s) => (
                          <div key={s.col} className="space-y-2">
                            <div className="flex items-center gap-2 font-medium text-sm">
                              <s.icon className="size-4" />
                              {s.title}
                              <Badge variant="outline">{s.assigned.length}</Badge>
                            </div>
                            <div className="space-y-1">
                              {s.assigned.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1 text-sm"
                                >
                                  <span className="truncate">{item.title}</span>
                                  <button
                                    onClick={() => unassignItem(s.col, item.id)}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                    title="Убрать из сферы"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                              {s.assigned.length === 0 && (
                                <div className="text-sm text-muted-foreground px-2 py-1">
                                  Пусто
                                </div>
                              )}
                            </div>
                            <Select
                              value=""
                              onValueChange={(id) => id && assignItem(s.col, id, key)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="+ Добавить..." />
                              </SelectTrigger>
                              <SelectContent>
                                {s.available.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                    {item.area ? ` — сейчас: ${areaLabel(item.area)}` : ""}
                                  </SelectItem>
                                ))}
                                {s.available.length === 0 && (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Нет доступных
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новая сфера</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newArea.label}
                onChange={(e) =>
                  setNewArea({
                    ...newArea,
                    label: e.target.value,
                    key: keyEdited ? newArea.key : slugify(e.target.value),
                  })
                }
                placeholder="Здоровье"
              />
            </div>
            <div className="space-y-2">
              <Label>Ключ (латиницей, для базы)</Label>
              <Input
                value={newArea.key}
                onChange={(e) => {
                  setKeyEdited(true);
                  setNewArea({ ...newArea, key: slugify(e.target.value) || e.target.value });
                }}
                placeholder="zdorove"
                className="font-mono"
              />
              {newArea.key && areaKeys.includes(newArea.key) && (
                <p className="text-sm text-destructive">
                  Сфера с таким ключом уже существует
                </p>
              )}
            </div>
            <Button
              onClick={handleAddArea}
              className="w-full"
              disabled={
                saving ||
                !newArea.key.trim() ||
                !newArea.label.trim() ||
                areaKeys.includes(newArea.key)
              }
            >
              {saving ? "Сохранение..." : "Создать сферу"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
