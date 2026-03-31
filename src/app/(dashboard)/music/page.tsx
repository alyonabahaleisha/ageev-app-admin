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
import { MusicTrackDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const emptyTrack: Omit<MusicTrackDoc, "id"> = {
  title: "",
  artist: "",
  fileName: "",
  durationSeconds: 0,
  audioUrl: "",
  sortOrder: 0,
};

export default function MusicPage() {
  const [tracks, setTracks] = useState<MusicTrackDoc[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTrack);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "musicTracks"), orderBy("sortOrder"));
    return onSnapshot(q, (snap) => {
      setTracks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MusicTrackDoc))
      );
    });
  }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyTrack, sortOrder: tracks.length });
    setAudioFile(null);
    setDialogOpen(true);
  }

  function openEdit(track: MusicTrackDoc) {
    setEditingId(track.id);
    setForm({
      title: track.title,
      artist: track.artist,
      fileName: track.fileName,
      durationSeconds: track.durationSeconds,
      audioUrl: track.audioUrl,
      sortOrder: track.sortOrder,
    });
    setAudioFile(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let audioUrl = form.audioUrl;
      let fileName = form.fileName;

      if (audioFile) {
        fileName = audioFile.name;
        audioUrl = await uploadFile(`audio/music/${fileName}`, audioFile);
      }

      const id =
        editingId ||
        form.title
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      await setDoc(doc(db, "musicTracks", id), {
        title: form.title,
        artist: form.artist,
        fileName,
        durationSeconds: form.durationSeconds,
        audioUrl,
        sortOrder: form.sortOrder,
      });

      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Удалить трек?")) {
      await deleteDoc(doc(db, "musicTracks", id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Музыка</h1>
        <Button onClick={openNew}>
          <Plus className="size-4 mr-2" />
          Добавить
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Исполнитель</TableHead>
            <TableHead>Длительность</TableHead>
            <TableHead>Файл</TableHead>
            <TableHead className="w-24">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell className="font-medium">{track.title}</TableCell>
              <TableCell>{track.artist || "—"}</TableCell>
              <TableCell>{formatDuration(track.durationSeconds)}</TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-32">
                {track.fileName || "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(track)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(track.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {tracks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                Нет треков.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать трек" : "Новый трек"}
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
              <Label>Исполнитель</Label>
              <Input
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
              />
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
