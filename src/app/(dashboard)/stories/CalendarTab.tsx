"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  StoryPhotoDoc,
  StoryQuoteDoc,
  BreakfastDoc,
  StoryAffirmationDoc,
  DailyStoryDoc,
  LIFE_AREAS,
  AREA_LABELS,
  LifeArea,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const NONE = "__none__";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function todayKey() {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

export function CalendarTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [photos, setPhotos] = useState<StoryPhotoDoc[]>([]);
  const [quotes, setQuotes] = useState<StoryQuoteDoc[]>([]);
  const [breakfasts, setBreakfasts] = useState<BreakfastDoc[]>([]);
  const [affirmations, setAffirmations] = useState<StoryAffirmationDoc[]>([]);
  // Existing in-app affirmations, grouped by life area.
  const [existingAffs, setExistingAffs] = useState<
    { area: LifeArea; texts: string[] }[]
  >([]);
  const [schedule, setSchedule] = useState<Record<string, DailyStoryDoc>>({});
  const [loading, setLoading] = useState(true);

  const [editDate, setEditDate] = useState<string | null>(null);
  const [draft, setDraft] = useState<DailyStoryDoc | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [ph, q, b, af, existing, days] = await Promise.all([
        getDocs(collection(db, "storyPhotos")),
        getDocs(collection(db, "storyQuotes")),
        getDocs(collection(db, "breakfasts")),
        getDocs(collection(db, "storyAffirmations")),
        getDocs(collection(db, "affirmations")),
        getDocs(collection(db, "dailyStories")),
      ]);
      const bySort = (a: { sortOrder?: number }, c: { sortOrder?: number }) =>
        (a.sortOrder ?? 0) - (c.sortOrder ?? 0);
      setPhotos(ph.docs.map((d) => ({ id: d.id, ...d.data() } as StoryPhotoDoc)).sort(bySort));
      setQuotes(q.docs.map((d) => ({ id: d.id, ...d.data() } as StoryQuoteDoc)).sort(bySort));
      setBreakfasts(b.docs.map((d) => ({ id: d.id, ...d.data() } as BreakfastDoc)).sort(bySort));
      setAffirmations(af.docs.map((d) => ({ id: d.id, ...d.data() } as StoryAffirmationDoc)).sort(bySort));

      const existingByArea: Record<string, string[]> = {};
      existing.docs.forEach((d) => {
        const texts = (d.data().texts as string[]) || [];
        if (texts.length) existingByArea[d.id] = texts;
      });
      setExistingAffs(
        LIFE_AREAS.filter((a) => existingByArea[a]?.length).map((a) => ({
          area: a,
          texts: existingByArea[a],
        }))
      );

      const map: Record<string, DailyStoryDoc> = {};
      days.docs.forEach((d) => {
        map[d.id] = { date: d.id, ...d.data() } as DailyStoryDoc;
      });
      setSchedule(map);
      setLoading(false);
    })();
  }, []);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  function openDay(d: number) {
    const key = dateKey(year, month, d);
    const existing = schedule[key];
    setEditDate(key);
    setDraft(
      existing
        ? { ...existing, affirmationText: existing.affirmationText || "" }
        : {
            date: key,
            photoId: "",
            quoteId: "",
            breakfastId: "",
            affirmationId: "",
            affirmationText: "",
          }
    );
  }

  async function saveDay() {
    if (!draft || !editDate) return;
    setSaving(true);
    try {
      const { date, ...rest } = draft;
      await setDoc(doc(db, "dailyStories", editDate), { date, ...rest });
      setSchedule((prev) => ({ ...prev, [editDate]: { ...draft, date: editDate } }));
      setEditDate(null);
    } finally {
      setSaving(false);
    }
  }

  async function clearDay() {
    if (!editDate) return;
    if (!confirm("Очистить этот день?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "dailyStories", editDate));
      setSchedule((prev) => {
        const next = { ...prev };
        delete next[editDate];
        return next;
      });
      setEditDate(null);
    } finally {
      setSaving(false);
    }
  }

  const tKey = todayKey();
  const draftPhoto = photos.find((p) => p.id === draft?.photoId);
  const draftAff = affirmations.find((a) => a.id === draft?.affirmationId);
  const draftBreakfast = breakfasts.find((b) => b.id === draft?.breakfastId);

  // Value→label maps so the Select trigger shows a readable label instead of
  // the raw id/value (base-ui Select.Value renders the value otherwise).
  const photoItems: Record<string, string> = {
    [NONE]: "— не выбрано —",
    ...Object.fromEntries(photos.map((p, i) => [p.id, p.title || `Фото ${i + 1}`])),
  };
  const quoteItems: Record<string, string> = {
    [NONE]: "— не выбрано —",
    ...Object.fromEntries(
      quotes.map((q, i) => [q.id, q.text.slice(0, 60) || `Цитата ${i + 1}`])
    ),
  };
  const breakfastItems: Record<string, string> = {
    [NONE]: "— не выбрано —",
    ...Object.fromEntries(
      breakfasts.map((b, i) => [b.id, b.title || `Завтрак ${i + 1}`])
    ),
  };
  const affItems: Record<string, string> = {
    [NONE]: "— не выбрано —",
    ...Object.fromEntries(
      affirmations.map((a) => [`aff:${a.id}`, a.text.slice(0, 60) || a.id])
    ),
    ...Object.fromEntries(
      existingAffs.flatMap((g) => g.texts.map((t) => [`txt:${t}`, t.slice(0, 60)]))
    ),
  };

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  const emptyPools =
    photos.length === 0 &&
    quotes.length === 0 &&
    breakfasts.length === 0 &&
    affirmations.length === 0;

  return (
    <div className="space-y-4">
      {emptyPools && (
        <p className="text-sm text-amber-600">
          Сначала добавьте контент во вкладках «Фото», «Цитаты», «Аффирмации» и
          «Духовные завтраки» (на странице «Вебинары») — потом его можно будет
          назначать на дни.
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-lg font-semibold w-44 text-center">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setYear(now.getFullYear());
            setMonth(now.getMonth());
          }}
        >
          Сегодня
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {w}
          </div>
        ))}
        {grid.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = dateKey(year, month, d);
          const scheduled = schedule[key];
          const isToday = key === tKey;
          const isPast = key < tKey;
          const filled =
            scheduled &&
            (scheduled.photoId ||
              scheduled.quoteId ||
              scheduled.breakfastId ||
              scheduled.affirmationId);
          return (
            <button
              key={i}
              onClick={() => openDay(d)}
              className={[
                "aspect-square rounded-md border p-1.5 text-left text-sm flex flex-col transition-colors hover:bg-muted/60",
                isToday ? "border-primary ring-1 ring-primary" : "border-border",
                isPast ? "opacity-50" : "",
                filled ? "bg-primary/5" : "",
              ].join(" ")}
            >
              <span className="font-medium">{d}</span>
              {filled && (
                <span className="mt-auto inline-flex items-center gap-1 text-[10px] text-primary">
                  <Check className="size-3" />
                  готово
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!editDate} onOpenChange={(o) => !o && setEditDate(null)}>
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Сторис на {editDate}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-5 min-w-0">
              {/* Reel 1 — photo + quote */}
              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-xs font-semibold">
                  Сторис 1 · Фото + цитата
                </Label>
                <div className="flex gap-3 min-w-0">
                  {draftPhoto?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draftPhoto.imageUrl}
                      alt=""
                      className="w-14 h-14 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2 min-w-0">
                    <Select
                      items={photoItems}
                      value={draft.photoId || NONE}
                      onValueChange={(v) =>
                        setDraft((prev) =>
                          prev ? { ...prev, photoId: v && v !== NONE ? v : "" } : prev
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Фото..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— не выбрано —</SelectItem>
                        {photos.map((p, i) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title || `Фото ${i + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      items={quoteItems}
                      value={draft.quoteId || NONE}
                      onValueChange={(v) =>
                        setDraft((prev) =>
                          prev ? { ...prev, quoteId: v && v !== NONE ? v : "" } : prev
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Цитата..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— не выбрано —</SelectItem>
                        {quotes.map((q, i) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.text.slice(0, 50) || `Цитата ${i + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Reel 2 — breakfast */}
              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-xs font-semibold">
                  Сторис 2 · Духовный завтрак
                </Label>
                <div className="flex gap-3 min-w-0">
                  {draftBreakfast?.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draftBreakfast.coverUrl}
                      alt=""
                      className="w-14 h-14 rounded object-cover shrink-0"
                    />
                  )}
                  <Select
                    items={breakfastItems}
                    value={draft.breakfastId || NONE}
                    onValueChange={(v) =>
                      setDraft((prev) =>
                        prev ? { ...prev, breakfastId: v && v !== NONE ? v : "" } : prev
                      )
                    }
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Завтрак..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— не выбрано —</SelectItem>
                      {breakfasts.map((b, i) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title || `Завтрак ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reel 3 — affirmation */}
              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-xs font-semibold">
                  Сторис 3 · Аффирмация дня
                </Label>
                <div className="flex gap-3 min-w-0">
                  {draftAff?.background && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draftAff.background}
                      alt=""
                      className="w-14 h-14 rounded object-cover shrink-0"
                    />
                  )}
                  <Select
                    items={affItems}
                    value={
                      draft.affirmationId
                        ? `aff:${draft.affirmationId}`
                        : draft.affirmationText
                        ? `txt:${draft.affirmationText}`
                        : NONE
                    }
                    onValueChange={(v) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        if (v && v.startsWith("aff:"))
                          return {
                            ...prev,
                            affirmationId: v.slice(4),
                            affirmationText: "",
                          };
                        if (v && v.startsWith("txt:"))
                          return {
                            ...prev,
                            affirmationId: "",
                            affirmationText: v.slice(4),
                          };
                        return { ...prev, affirmationId: "", affirmationText: "" };
                      })
                    }
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Аффирмация..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value={NONE}>— не выбрано —</SelectItem>
                      {affirmations.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Сторис-аффирмации</SelectLabel>
                          {affirmations.map((a) => (
                            <SelectItem key={a.id} value={`aff:${a.id}`}>
                              {a.text.slice(0, 60) || a.id}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {existingAffs.map((grp) => (
                        <SelectGroup key={grp.area}>
                          <SelectLabel>{AREA_LABELS[grp.area]}</SelectLabel>
                          {grp.texts.map((t, i) => (
                            <SelectItem key={`${grp.area}_${i}`} value={`txt:${t}`}>
                              {t.slice(0, 60)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={clearDay}
                  disabled={saving || !schedule[editDate!]}
                >
                  Очистить день
                </Button>
                <Button onClick={saveDay} disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
