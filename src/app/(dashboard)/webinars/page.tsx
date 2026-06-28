"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import { WebinarDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { BreakfastsTab } from "./BreakfastsTab";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const emptyWebinar: Omit<WebinarDoc, "id"> = {
  title: "",
  description: "",
  fileName: "",
  durationSeconds: 0,
  audioUrl: "",
  coverUrl: "",
  sortOrder: 0,
  popular: false,
  coverColor: "",
};

function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(""); return; }
      const srcY = Math.floor(img.height * 2 / 3);
      const srcH = img.height - srcY;
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      resolve(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
    };
    img.onerror = () => resolve("");
    img.src = URL.createObjectURL(file);
  });
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<WebinarDoc[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWebinar);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "webinars"), orderBy("sortOrder"));
    return onSnapshot(q, (snap) => {
      setWebinars(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebinarDoc))
      );
    });
  }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyWebinar, sortOrder: webinars.length });
    setAudioFile(null);
    setCoverFile(null);
    setDialogOpen(true);
  }

  function openEdit(w: WebinarDoc) {
    setEditingId(w.id);
    setForm({
      title: w.title,
      description: w.description,
      fileName: w.fileName,
      durationSeconds: w.durationSeconds,
      audioUrl: w.audioUrl,
      coverUrl: w.coverUrl,
      sortOrder: w.sortOrder,
      popular: w.popular || false,
      coverColor: w.coverColor || "",
    });
    setAudioFile(null);
    setCoverFile(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let audioUrl = form.audioUrl;
      let coverUrl = form.coverUrl;
      let fileName = form.fileName;

      if (audioFile) {
        fileName = audioFile.name;
        audioUrl = await uploadFile(`audio/webinars/${fileName}`, audioFile);
      }
      let coverColor = form.coverColor || "";
      if (coverFile) {
        coverUrl = await uploadFile(`images/webinars/${coverFile.name}`, coverFile);
        coverColor = await extractDominantColor(coverFile);
      }

      const id =
        editingId ||
        form.title
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      await setDoc(doc(db, "webinars", id), {
        title: form.title,
        description: form.description,
        fileName,
        durationSeconds: form.durationSeconds,
        audioUrl,
        coverUrl,
        coverColor,
        sortOrder: form.sortOrder,
        popular: form.popular || false,
      });

      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Удалить вебинар?")) {
      await deleteDoc(doc(db, "webinars", id));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Вебинары и завтраки</h1>

      <Tabs defaultValue="webinars">
        <TabsList>
          <TabsTrigger value="webinars">Вебинары</TabsTrigger>
          <TabsTrigger value="breakfasts">Духовные завтраки</TabsTrigger>
        </TabsList>

        <TabsContent value="webinars" className="pt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNew}>
              <Plus className="size-4 mr-2" />
              Добавить
            </Button>
          </div>

          <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Обложка</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Длительность</TableHead>
            <TableHead>Аудио</TableHead>
            <TableHead className="w-24">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webinars.map((w) => (
            <TableRow key={w.id}>
              <TableCell>
                {w.coverUrl ? (
                  <img
                    src={w.coverUrl}
                    alt={w.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">
                {w.title}
                {w.popular && (
                  <Badge className="ml-2" variant="default">
                    Рекомендованный
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatDuration(w.durationSeconds)}</TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-32">
                {w.fileName || "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(w)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(w.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {webinars.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                Нет вебинаров. Нажмите «Добавить», чтобы загрузить первый.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="breakfasts" className="pt-4">
          <BreakfastsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать вебинар" : "Новый вебинар"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Длительность (секунды)</Label>
              <Input
                type="number"
                value={form.durationSeconds}
                onChange={(e) =>
                  setForm({ ...form, durationSeconds: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Аудио / видео файл</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
                {form.audioUrl && !audioFile && (
                  <Badge variant="outline">Загружен</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Обложка</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                {form.coverUrl && !coverFile && (
                  <img
                    src={form.coverUrl}
                    alt="cover"
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Порядок сортировки</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="popular"
                checked={form.popular || false}
                onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="popular">Рекомендованный вебинар</Label>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              <Upload className="size-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
