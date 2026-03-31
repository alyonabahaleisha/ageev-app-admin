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
import { MeditationDoc, LIFE_AREAS, AREA_LABELS, LifeArea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const emptyMeditation: Omit<MeditationDoc, "id"> = {
  title: "",
  description: "",
  area: "money",
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
      // Sample bottom third of image
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

export default function MeditationsPage() {
  const [meditations, setMeditations] = useState<MeditationDoc[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMeditation);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "meditations"), orderBy("sortOrder"));
    return onSnapshot(q, (snap) => {
      setMeditations(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MeditationDoc))
      );
    });
  }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyMeditation, sortOrder: meditations.length });
    setAudioFile(null);
    setCoverFile(null);
    setDialogOpen(true);
  }

  function openEdit(med: MeditationDoc) {
    setEditingId(med.id);
    setForm({
      title: med.title,
      description: med.description,
      area: med.area,
      fileName: med.fileName,
      durationSeconds: med.durationSeconds,
      audioUrl: med.audioUrl,
      coverUrl: med.coverUrl,
      sortOrder: med.sortOrder,
      popular: med.popular || false,
      coverColor: med.coverColor || "",
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
        audioUrl = await uploadFile(`audio/meditations/${fileName}`, audioFile);
      }
      let coverColor = form.coverColor || "";
      if (coverFile) {
        coverUrl = await uploadFile(
          `images/meditations/${coverFile.name}`,
          coverFile
        );
        coverColor = await extractDominantColor(coverFile);
      }

      const id = editingId || form.title.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      await setDoc(doc(db, "meditations", id), {
        title: form.title,
        description: form.description,
        area: form.area,
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
    if (confirm("Удалить медитацию?")) {
      await deleteDoc(doc(db, "meditations", id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Медитации</h1>
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
            <TableHead>Сфера</TableHead>
            <TableHead>Длительность</TableHead>
            <TableHead>Аудио</TableHead>
            <TableHead className="w-24">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meditations.map((med) => (
            <TableRow key={med.id}>
              <TableCell>
                {med.coverUrl ? (
                  <img
                    src={med.coverUrl}
                    alt={med.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">
                {med.title}
                {med.popular && (
                  <Badge className="ml-2" variant="default">Популярная</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {AREA_LABELS[med.area] || med.area}
                </Badge>
              </TableCell>
              <TableCell>{formatDuration(med.durationSeconds)}</TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-32">
                {med.fileName || "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(med)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(med.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {meditations.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Нет медитаций. Запустите seed-скрипт или добавьте вручную.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать медитацию" : "Новая медитация"}
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
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Сфера жизни</Label>
              <Select
                value={form.area}
                onValueChange={(v) =>
                  setForm({ ...form, area: v as LifeArea })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AREA_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Длительность (секунды)</Label>
              <Input
                type="number"
                value={form.durationSeconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationSeconds: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Аудио файл</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="audio/*"
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
                  setForm({
                    ...form,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
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
              <Label htmlFor="popular">Популярная медитация</Label>
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
