"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import { BreakfastDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { itemAreas, useLifeAreas } from "@/lib/use-life-areas";
import { ImageUploadField } from "@/components/image-upload-field";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Draft = Partial<Omit<BreakfastDoc, "id">>;

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration) || 0);
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}

export function BreakfastsTab() {
  const [items, setItems] = useState<BreakfastDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Все правки карточки копятся в черновике и попадают в Firestore только по
  // кнопке «Сохранить» (загруженные файлы сразу уходят в Storage, но ссылка
  // на них тоже сохраняется в документ только по кнопке).
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const { areaKeys, areaLabel } = useLifeAreas();

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "breakfasts"), orderBy("sortOrder"))
      );
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BreakfastDoc)));
      setLoading(false);
    })();
  }, []);

  function edit(id: string, changes: Draft) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));
  }

  /** Текущее (отображаемое) состояние карточки: документ + черновик. */
  function view(b: BreakfastDoc): BreakfastDoc {
    return { ...b, ...drafts[b.id] };
  }

  function isDirty(b: BreakfastDoc) {
    const draft = drafts[b.id];
    if (!draft) return false;
    return (Object.keys(draft) as (keyof Draft)[]).some(
      (k) => draft[k] !== b[k]
    );
  }

  async function save(b: BreakfastDoc) {
    setSavingId(b.id);
    try {
      const { id, ...rest } = view(b);
      await setDoc(doc(db, "breakfasts", id), rest);
      setItems((prev) => prev.map((x) => (x.id === id ? { id, ...rest } : x)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Breakfast save failed", err);
      alert("Не удалось сохранить");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAudio(id: string, file: File) {
    setUploadingId(id);
    try {
      const [url, duration] = await Promise.all([
        uploadFile(`audio/breakfasts/${Date.now()}_${file.name}`, file),
        getAudioDuration(file),
      ]);
      edit(id, {
        audioUrl: url,
        fileName: file.name,
        durationSeconds: duration,
      });
    } catch (err) {
      console.error("Breakfast audio upload failed", err);
      alert("Не удалось загрузить аудио");
    } finally {
      setUploadingId(null);
    }
  }

  async function addItem() {
    const id = `breakfast_${Date.now()}`;
    const empty = {
      title: "",
      description: "",
      fileName: "",
      durationSeconds: 0,
      audioUrl: "",
      coverUrl: "",
      sortOrder: items.length,
      area: "",
      areas: [] as string[],
    };
    await setDoc(doc(db, "breakfasts", id), empty);
    setItems((prev) => [...prev, { id, ...empty }]);
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить завтрак?")) return;
    await deleteDoc(doc(db, "breakfasts", id));
    setItems((prev) => prev.filter((b) => b.id !== id));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        «Духовный завтрак» для второго сторис — аудио-практика (как медитация).
        Изменения применяются по кнопке «Сохранить» на карточке.
      </p>
      <div className="space-y-3">
        {items.map((b) => {
          const v = view(b);
          const dirty = isDirty(b);
          return (
            <Card key={b.id}>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Название</Label>
                    <Input
                      value={v.title}
                      onChange={(e) => edit(b.id, { title: e.target.value })}
                      placeholder="Духовный завтрак"
                    />
                  </div>
                  <ImageUploadField
                    label="Фон (обложка)"
                    value={v.coverUrl}
                    onChange={(url) => edit(b.id, { coverUrl: url })}
                    folder="stories/breakfasts"
                  />
                  <div className="space-y-1">
                    <Label className="text-xs">Сферы жизни (можно несколько)</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {areaKeys.map((a) => {
                        const selected = itemAreas(v).includes(a);
                        return (
                          <Badge
                            key={a}
                            variant={selected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const cur = itemAreas(v);
                              const next = selected
                                ? cur.filter((x) => x !== a)
                                : [...cur, a];
                              edit(b.id, { areas: next, area: next[0] ?? "" });
                            }}
                          >
                            {areaLabel(a)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Текст на сторис</Label>
                  <Textarea
                    value={v.description}
                    rows={2}
                    onChange={(e) =>
                      edit(b.id, { description: e.target.value })
                    }
                    placeholder="То, как вы определяете себя в начале дня... Кто ты сегодня?"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Аудио</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="audio/*"
                      className="max-w-xs"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAudio(b.id, f);
                      }}
                    />
                    {uploadingId === b.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : v.audioUrl ? (
                      <Badge variant="outline">
                        Загружено · {formatDuration(v.durationSeconds)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeItem(b.id)}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Удалить
                  </Button>
                  <Button
                    size="sm"
                    disabled={!dirty || savingId === b.id}
                    onClick={() => save(b)}
                  >
                    {savingId === b.id ? (
                      <Loader2 className="size-4 mr-1 animate-spin" />
                    ) : null}
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button variant="outline" onClick={addItem}>
        <Plus className="size-4 mr-2" />
        Добавить завтрак
      </Button>
    </div>
  );
}
