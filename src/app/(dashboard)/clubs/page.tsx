"use client";

import { Fragment, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClubDoc } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save } from "lucide-react";

// Transliterates Cyrillic to Latin before stripping non-alphanumeric characters.
// The bare regex /[^a-z0-9_]/ strips all Cyrillic, producing empty IDs — so
// transliteration must happen first.
function slugify(text: string): string {
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => translitMap[c] ?? c)
    .join("")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const emptyClub: Omit<ClubDoc, "id"> = {
  country: "",
  city: "",
  leader: "",
  telegramUrl: "",
  vkUrl: "",
  region: "abroad",
  sortOrder: 0,
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubDoc[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ClubDoc, "id">>(emptyClub);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "clubs"), (snap) => {
      setClubs(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClubDoc))
      );
    });
  }, []);

  // Group and sort clubs: countries A→Z, within each country by sortOrder then
  // city name A→Z. Both sorts use the "ru" locale for correct Cyrillic ordering.
  const grouped = clubs
    .slice()
    .sort((a, b) => {
      const countryCmp = a.country.localeCompare(b.country, "ru");
      if (countryCmp !== 0) return countryCmp;
      return a.sortOrder - b.sortOrder || a.city.localeCompare(b.city, "ru");
    })
    .reduce<Record<string, ClubDoc[]>>((acc, club) => {
      (acc[club.country] ||= []).push(club);
      return acc;
    }, {});

  const countryNames = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyClub });
    setDialogOpen(true);
  }

  function openEdit(club: ClubDoc) {
    setEditingId(club.id);
    setForm({
      country: club.country,
      city: club.city,
      leader: club.leader,
      telegramUrl: club.telegramUrl,
      vkUrl: club.vkUrl || "",
      region: club.region,
      sortOrder: club.sortOrder,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // On edit, keep the original document ID. On create, derive it from
      // country + city so duplicates are idempotent overwrites (same as music page).
      const id =
        editingId ||
        `${slugify(form.country)}_${slugify(form.city)}`;
      await setDoc(doc(db, "clubs", id), {
        country: form.country,
        city: form.city,
        leader: form.leader,
        telegramUrl: form.telegramUrl,
        vkUrl: form.vkUrl || "",
        region: form.region,
        sortOrder: form.sortOrder,
      });
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save club:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, city: string) {
    if (confirm(`Удалить клуб ${city}?`)) {
      await deleteDoc(doc(db, "clubs", id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клубы</h1>
        <Button onClick={openNew}>
          <Plus className="size-4 mr-2" />
          Добавить
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Город</TableHead>
            <TableHead>Руководитель</TableHead>
            <TableHead>Telegram</TableHead>
            <TableHead>Регион</TableHead>
            <TableHead className="w-20">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                Нет клубов. Нажмите «Добавить», чтобы создать первый.
              </TableCell>
            </TableRow>
          ) : (
            countryNames.map((country) => (
              <Fragment key={country}>
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/40 border-t"
                  >
                    {country}
                  </TableCell>
                </TableRow>
                {grouped[country].map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.city}</TableCell>
                    <TableCell>
                      {club.leader ? (
                        club.leader
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {club.telegramUrl || club.vkUrl ? (
                        <>
                          {club.telegramUrl && (
                            <a
                              href={club.telegramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="max-w-48 truncate text-xs text-muted-foreground block"
                            >
                              {club.telegramUrl}
                            </a>
                          )}
                          {club.vkUrl && (
                            <a
                              href={club.vkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="max-w-48 truncate text-xs text-muted-foreground block"
                            >
                              {club.vkUrl}
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {club.region === "russia" ? (
                        <Badge variant="default">Россия</Badge>
                      ) : (
                        <Badge variant="secondary">Зарубежье</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(club)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(club.id, club.city)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать клуб" : "Новый клуб"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club-country">Страна</Label>
              <Input
                id="club-country"
                placeholder="Например: Турция"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-city">Город</Label>
              <Input
                id="club-city"
                placeholder="Например: Анталья"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-leader">Руководитель</Label>
              <Input
                id="club-leader"
                placeholder="Имя и фамилия"
                value={form.leader}
                onChange={(e) => setForm({ ...form, leader: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-telegram">Telegram ссылка</Label>
              <Input
                id="club-telegram"
                type="url"
                placeholder="https://t.me/+..."
                value={form.telegramUrl}
                onChange={(e) =>
                  setForm({ ...form, telegramUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-vk">ВКонтакте ссылка</Label>
              <Input
                id="club-vk"
                type="url"
                placeholder="https://vk.com/..."
                value={form.vkUrl || ""}
                onChange={(e) => setForm({ ...form, vkUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-region">Регион</Label>
              <Select
                value={form.region}
                onValueChange={(v) =>
                  setForm({ ...form, region: v as "abroad" | "russia" })
                }
              >
                <SelectTrigger id="club-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abroad">Зарубежье</SelectItem>
                  <SelectItem value="russia">Россия</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-sort-order">Порядок сортировки</Label>
              <Input
                id="club-sort-order"
                type="number"
                placeholder="0"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Используется для ручной сортировки внутри страны
              </p>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              <Save className="size-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
