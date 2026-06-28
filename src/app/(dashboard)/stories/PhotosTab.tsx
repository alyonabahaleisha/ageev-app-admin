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
import { StoryPhotoDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploadField } from "@/components/image-upload-field";
import { Plus, Trash2 } from "lucide-react";

export function PhotosTab() {
  const [photos, setPhotos] = useState<StoryPhotoDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "storyPhotos"), orderBy("sortOrder"))
      );
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryPhotoDoc)));
      setLoading(false);
    })();
  }, []);

  async function persist(p: StoryPhotoDoc) {
    const { id, ...rest } = p;
    await setDoc(doc(db, "storyPhotos", id), rest);
  }

  function patch(id: string, changes: Partial<StoryPhotoDoc>) {
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...changes } : p));
      const target = next.find((p) => p.id === id);
      if (target) persist(target);
      return next;
    });
  }

  async function addPhoto() {
    const id = `photo_${Date.now()}`;
    const newPhoto: StoryPhotoDoc = {
      id,
      title: "",
      imageUrl: "",
      sortOrder: photos.length,
    };
    await setDoc(doc(db, "storyPhotos", id), {
      title: "",
      imageUrl: "",
      sortOrder: photos.length,
    });
    setPhotos((prev) => [...prev, newPhoto]);
  }

  async function removePhoto(id: string) {
    if (!confirm("Удалить фото?")) return;
    await deleteDoc(doc(db, "storyPhotos", id));
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Фотографии Михаила для первого сторис (фото + цитата).
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-3">
              <ImageUploadField
                value={p.imageUrl}
                onChange={(url) => patch(p.id, { imageUrl: url })}
                folder="stories/photos"
              />
              <div className="space-y-1">
                <Label className="text-xs">Подпись (для админа)</Label>
                <Input
                  defaultValue={p.title}
                  onBlur={(e) =>
                    e.target.value !== p.title &&
                    patch(p.id, { title: e.target.value })
                  }
                  placeholder="напр. «На берегу»"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removePhoto(p.id)}
              >
                <Trash2 className="size-4 mr-1" />
                Удалить
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={addPhoto}>
        <Plus className="size-4 mr-2" />
        Добавить фото
      </Button>
    </div>
  );
}
