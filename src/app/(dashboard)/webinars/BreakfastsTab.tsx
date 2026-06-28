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
import { ImageUploadField } from "@/components/image-upload-field";
import { Plus, Trash2, Loader2 } from "lucide-react";

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

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "breakfasts"), orderBy("sortOrder"))
      );
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BreakfastDoc)));
      setLoading(false);
    })();
  }, []);

  async function persist(b: BreakfastDoc) {
    const { id, ...rest } = b;
    await setDoc(doc(db, "breakfasts", id), rest);
  }

  function patch(id: string, changes: Partial<BreakfastDoc>) {
    setItems((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...changes } : b));
      const target = next.find((b) => b.id === id);
      if (target) persist(target);
      return next;
    });
  }

  async function handleAudio(id: string, file: File) {
    setUploadingId(id);
    try {
      const [url, duration] = await Promise.all([
        uploadFile(`audio/breakfasts/${Date.now()}_${file.name}`, file),
        getAudioDuration(file),
      ]);
      patch(id, {
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
    };
    await setDoc(doc(db, "breakfasts", id), empty);
    setItems((prev) => [...prev, { id, ...empty }]);
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить завтрак?")) return;
    await deleteDoc(doc(db, "breakfasts", id));
    setItems((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        «Духовный завтрак» для второго сторис — аудио-практика (как медитация).
      </p>
      <div className="space-y-3">
        {items.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Название</Label>
                  <Input
                    defaultValue={b.title}
                    onBlur={(e) =>
                      e.target.value !== b.title &&
                      patch(b.id, { title: e.target.value })
                    }
                    placeholder="Духовный завтрак"
                  />
                </div>
                <ImageUploadField
                  label="Фон (обложка)"
                  value={b.coverUrl}
                  onChange={(url) => patch(b.id, { coverUrl: url })}
                  folder="stories/breakfasts"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Текст на сторис</Label>
                <Textarea
                  defaultValue={b.description}
                  rows={2}
                  onBlur={(e) =>
                    e.target.value !== b.description &&
                    patch(b.id, { description: e.target.value })
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
                  ) : b.audioUrl ? (
                    <Badge variant="outline">
                      Загружено · {formatDuration(b.durationSeconds)}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeItem(b.id)}
              >
                <Trash2 className="size-4 mr-1" />
                Удалить
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={addItem}>
        <Plus className="size-4 mr-2" />
        Добавить завтрак
      </Button>
    </div>
  );
}
