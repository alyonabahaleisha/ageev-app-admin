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
import { StoryAffirmationDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploadField } from "@/components/image-upload-field";
import { Plus, Trash2 } from "lucide-react";

export function AffirmationsTab() {
  const [items, setItems] = useState<StoryAffirmationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "storyAffirmations"), orderBy("sortOrder"))
      );
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryAffirmationDoc))
      );
      setLoading(false);
    })();
  }, []);

  async function persist(a: StoryAffirmationDoc) {
    const { id, ...rest } = a;
    await setDoc(doc(db, "storyAffirmations", id), rest);
  }

  function patch(id: string, changes: Partial<StoryAffirmationDoc>) {
    setItems((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...changes } : a));
      const target = next.find((a) => a.id === id);
      if (target) persist(target);
      return next;
    });
  }

  async function addItem() {
    const id = `aff_${Date.now()}`;
    const newItem: StoryAffirmationDoc = {
      id,
      text: "",
      background: "",
      sortOrder: items.length,
    };
    await setDoc(doc(db, "storyAffirmations", id), {
      text: "",
      background: "",
      sortOrder: items.length,
    });
    setItems((prev) => [...prev, newItem]);
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить аффирмацию?")) return;
    await deleteDoc(doc(db, "storyAffirmations", id));
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Аффирмации для третьего сторис («Аффирмация дня»), каждая со своим фоном.
      </p>
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Текст аффирмации</Label>
                <Textarea
                  defaultValue={a.text}
                  rows={2}
                  onBlur={(e) =>
                    e.target.value !== a.text &&
                    patch(a.id, { text: e.target.value })
                  }
                  placeholder="Я доверяю жизни и чувствую поддержку в каждом шаге"
                />
              </div>
              <ImageUploadField
                label="Фон"
                value={a.background}
                onChange={(url) => patch(a.id, { background: url })}
                folder="stories/affirmations"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeItem(a.id)}
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
        Добавить аффирмацию
      </Button>
    </div>
  );
}
