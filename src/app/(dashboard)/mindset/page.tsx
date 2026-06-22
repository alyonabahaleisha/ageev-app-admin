"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MINDSET_STATES,
  MINDSET_STATE_LABELS,
  MindsetStateDoc,
  MindsetStateExercise,
  MindsetStateLink,
  ExerciseStep,
  MeditationDoc,
  MusicTrackDoc,
  WebinarDoc,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Plus, X, Trash2 } from "lucide-react";

const EMPTY_EXERCISE: MindsetStateExercise = {
  title: "",
  durationText: "",
  description: "",
  intro: "",
  image: "",
  stepsBackground: "",
  steps: [],
  recommendations: [],
};

const EMPTY_STATE: MindsetStateDoc = {
  title: "",
  subtitle: "",
  emoji: "",
  coverImage: "",
  sortOrder: 0,
  exercise: { ...EMPTY_EXERCISE },
  affirmations: [],
  affirmationsBackground: "",
  breakfastTitle: "",
  breakfastUrl: "",
  audioId: "",
  meditationIds: [],
  webinarIds: [],
  externalLinks: [],
};

interface StateEntry {
  id: string;
  label: string;
  sortOrder: number;
}

// Reads both the new shape and the legacy { practiceText, links } shape.
function normalizeState(raw: Record<string, unknown>): MindsetStateDoc {
  const legacyLinks = (raw.links || {}) as {
    audioId?: string;
    meditationId?: string;
    webinarUrl?: string;
  };
  const exercise = (raw.exercise || {}) as Partial<MindsetStateExercise> & {
    practiceText?: string;
  };
  return {
    title: (raw.title as string) || "",
    subtitle: (raw.subtitle as string) || "",
    emoji: (raw.emoji as string) || "",
    coverImage: (raw.coverImage as string) || "",
    sortOrder: (raw.sortOrder as number) ?? 0,
    exercise: {
      title: exercise.title || "",
      durationText: exercise.durationText || "",
      description: exercise.description || "",
      intro: exercise.intro || "",
      image: exercise.image || "",
      stepsBackground: exercise.stepsBackground || "",
      // Migrate a legacy single practiceText into one step.
      steps:
        exercise.steps && exercise.steps.length
          ? exercise.steps
          : exercise.practiceText
          ? [{ title: "", body: exercise.practiceText }]
          : [],
      recommendations: exercise.recommendations || [],
    },
    affirmations: (raw.affirmations as string[]) || [],
    affirmationsBackground: (raw.affirmationsBackground as string) || "",
    breakfastTitle: (raw.breakfastTitle as string) || "",
    breakfastUrl: (raw.breakfastUrl as string) || "",
    audioId: (raw.audioId as string) || legacyLinks.audioId || "",
    meditationIds:
      (raw.meditationIds as string[]) ||
      (legacyLinks.meditationId ? [legacyLinks.meditationId] : []),
    webinarIds: (raw.webinarIds as string[]) || [],
    externalLinks: Array.isArray(raw.externalLinks)
      ? (raw.externalLinks as MindsetStateLink[])
      : [],
  };
}

export default function MindsetPage() {
  const [statesList, setStatesList] = useState<StateEntry[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [data, setData] = useState<MindsetStateDoc>({ ...EMPTY_STATE });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [meditations, setMeditations] = useState<MeditationDoc[]>([]);
  const [webinars, setWebinars] = useState<WebinarDoc[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrackDoc[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      const [medSnap, webSnap, musicSnap, statesSnap] = await Promise.all([
        getDocs(collection(db, "meditations")),
        getDocs(collection(db, "webinars")),
        getDocs(collection(db, "musicTracks")),
        getDocs(collection(db, "mindsetStates")),
      ]);
      setMeditations(
        medSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as MeditationDoc)
      );
      setWebinars(
        webSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as WebinarDoc)
      );
      setMusicTracks(
        musicSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as MusicTrackDoc)
      );

      const entries: StateEntry[] = statesSnap.docs.map((d) => {
        const s = d.data() as MindsetStateDoc;
        return {
          id: d.id,
          label: `${s.title || d.id} ${s.emoji || ""}`.trim(),
          sortOrder: s.sortOrder ?? 99,
        };
      });

      if (entries.length === 0) {
        const defaults = MINDSET_STATES.map((id, i) => ({
          id,
          label: MINDSET_STATE_LABELS[id],
          sortOrder: i,
        }));
        setStatesList(defaults);
        if (defaults.length > 0) setSelectedState(defaults[0].id);
      } else {
        entries.sort((a, b) => a.sortOrder - b.sortOrder);
        setStatesList(entries);
        if (entries.length > 0) setSelectedState(entries[0].id);
      }
      setInitialLoading(false);
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    async function load() {
      setLoaded(false);
      try {
        const snap = await getDoc(doc(db, "mindsetStates", selectedState));
        if (snap.exists()) {
          setData(normalizeState(snap.data()));
        } else {
          setData({
            ...EMPTY_STATE,
            title: MINDSET_STATE_LABELS[selectedState as never] || selectedState,
            sortOrder: statesList.length,
          });
        }
      } catch {
        setData({ ...EMPTY_STATE });
      }
      setLoaded(true);
    }
    load();
  }, [selectedState, statesList.length]);

  function updateField<K extends keyof MindsetStateDoc>(
    key: K,
    value: MindsetStateDoc[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateExercise(
    key:
      | "title"
      | "durationText"
      | "description"
      | "intro"
      | "image"
      | "stepsBackground",
    value: string
  ) {
    setData((prev) => ({ ...prev, exercise: { ...prev.exercise, [key]: value } }));
  }

  type StepField = "steps" | "recommendations";

  function updateStep(
    field: StepField,
    index: number,
    key: keyof ExerciseStep,
    value: string
  ) {
    setData((prev) => {
      const next = [...prev.exercise[field]];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, exercise: { ...prev.exercise, [field]: next } };
    });
  }

  function addStep(field: StepField) {
    setData((prev) => ({
      ...prev,
      exercise: {
        ...prev.exercise,
        [field]: [...prev.exercise[field], { title: "", body: "" }],
      },
    }));
  }

  function removeStep(field: StepField, index: number) {
    setData((prev) => ({
      ...prev,
      exercise: {
        ...prev.exercise,
        [field]: prev.exercise[field].filter((_, i) => i !== index),
      },
    }));
  }

  function toggleId(key: "meditationIds" | "webinarIds", id: string) {
    setData((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(id)
          ? list.filter((x) => x !== id)
          : [...list, id],
      };
    });
  }

  function updateLink(
    index: number,
    key: keyof MindsetStateLink,
    value: string
  ) {
    setData((prev) => {
      const next = [...prev.externalLinks];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, externalLinks: next };
    });
  }

  function addLink() {
    setData((prev) => ({
      ...prev,
      externalLinks: [...prev.externalLinks, { title: "", url: "" }],
    }));
  }

  function removeLink(index: number) {
    setData((prev) => ({
      ...prev,
      externalLinks: prev.externalLinks.filter((_, i) => i !== index),
    }));
  }

  function updateAffirmation(index: number, value: string) {
    const next = [...data.affirmations];
    next[index] = value;
    updateField("affirmations", next);
  }

  function addAffirmation() {
    updateField("affirmations", [...data.affirmations, ""]);
  }

  function removeAffirmation(index: number) {
    updateField(
      "affirmations",
      data.affirmations.filter((_, i) => i !== index)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saveData: MindsetStateDoc = {
        ...data,
        affirmations: data.affirmations.filter((t) => t.trim()),
        externalLinks: data.externalLinks.filter((l) => l.url.trim()),
      };
      await setDoc(doc(db, "mindsetStates", selectedState), saveData);
      setStatesList((prev) =>
        prev.map((s) =>
          s.id === selectedState
            ? {
                ...s,
                label: `${saveData.title} ${saveData.emoji || ""}`.trim(),
                sortOrder: saveData.sortOrder,
              }
            : s
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddState() {
    const id = `state_${Date.now()}`;
    const newState: MindsetStateDoc = {
      ...EMPTY_STATE,
      title: "Новое состояние",
      sortOrder: statesList.length,
    };
    await setDoc(doc(db, "mindsetStates", id), newState);
    setStatesList((prev) => [
      ...prev,
      { id, label: newState.title, sortOrder: newState.sortOrder },
    ]);
    setSelectedState(id);
  }

  async function handleDeleteState() {
    if (!selectedState) return;
    if (!window.confirm(`Удалить "${data.title || selectedState}"?`)) return;
    await deleteDoc(doc(db, "mindsetStates", selectedState));
    const remaining = statesList.filter((s) => s.id !== selectedState);
    setStatesList(remaining);
    setSelectedState(remaining.length > 0 ? remaining[0].id : "");
  }

  if (initialLoading) {
    return <p className="text-muted-foreground p-6">Загрузка...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мышление</h1>
        <div className="flex gap-2">
          {selectedState && (
            <Button variant="outline" onClick={handleDeleteState}>
              <Trash2 className="size-4 mr-2" />
              Удалить
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !selectedState}>
            <Save className="size-4 mr-2" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statesList.map((state) => (
          <Badge
            key={state.id}
            variant={selectedState === state.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedState(state.id)}
          >
            {state.label}
          </Badge>
        ))}
        <Badge
          variant="outline"
          className="cursor-pointer border-dashed"
          onClick={handleAddState}
        >
          <Plus className="size-3 mr-1" />
          Добавить
        </Badge>
      </div>

      {!selectedState ? (
        <p className="text-muted-foreground">
          Выберите состояние или добавьте новое
        </p>
      ) : !loaded ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="space-y-6">
          {/* Basic fields */}
          <Card>
            <CardHeader>
              <CardTitle>
                {statesList.find((s) => s.id === selectedState)?.label ||
                  selectedState}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Название</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Порядок</Label>
                  <Input
                    type="number"
                    value={data.sortOrder}
                    onChange={(e) =>
                      updateField("sortOrder", Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Подзаголовок</Label>
                <Textarea
                  value={data.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  rows={2}
                  placeholder="Укрепите внутреннюю опору, доверие к себе..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Обложка (URL)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={data.coverImage}
                    onChange={(e) => updateField("coverImage", e.target.value)}
                    placeholder="https://..."
                  />
                  {data.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.coverImage}
                      alt="cover"
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise of the day */}
          <Card>
            <CardHeader>
              <CardTitle>Упражнение дня</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Название</Label>
                  <Input
                    value={data.exercise.title}
                    onChange={(e) => updateExercise("title", e.target.value)}
                    placeholder="«Кто ты сегодня?»"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Длительность</Label>
                  <Input
                    value={data.exercise.durationText}
                    onChange={(e) =>
                      updateExercise("durationText", e.target.value)
                    }
                    placeholder="3-5 мин"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Подпись на карточке (кратко)</Label>
                <Input
                  value={data.exercise.description}
                  onChange={(e) =>
                    updateExercise("description", e.target.value)
                  }
                  placeholder="Практика для внутренней опоры."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Вступление (первый экран упражнения)
                </Label>
                <Textarea
                  value={data.exercise.intro}
                  onChange={(e) => updateExercise("intro", e.target.value)}
                  rows={4}
                  placeholder="То, как вы определяете себя в начале дня..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Картинка на стартовом экране (URL)
                </Label>
                <Input
                  value={data.exercise.image}
                  onChange={(e) => updateExercise("image", e.target.value)}
                  placeholder="https://... (по умолчанию — обложка состояния)"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Фон экранов с шагами (URL)
                </Label>
                <Input
                  value={data.exercise.stepsBackground}
                  onChange={(e) =>
                    updateExercise("stepsBackground", e.target.value)
                  }
                  placeholder="https://... (фото на весь экран за шагами)"
                />
              </div>

              {/* Steps */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold">
                  Шаги упражнения ({data.exercise.steps.length})
                </Label>
                <p className="text-xs text-muted-foreground">
                  Пункты внутри шага разделяйте пустой строкой — между ними
                  появится разделитель.
                </p>
                {data.exercise.steps.map((step, i) => (
                  <div
                    key={i}
                    className="rounded-md border p-3 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Шаг {i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeStep("steps", i)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Input
                      value={step.title}
                      onChange={(e) =>
                        updateStep("steps", i, "title", e.target.value)
                      }
                      placeholder="Заголовок шага (напр. «Пробуждение и пауза»)"
                    />
                    <Textarea
                      value={step.body}
                      onChange={(e) =>
                        updateStep("steps", i, "body", e.target.value)
                      }
                      rows={4}
                      placeholder="Текст шага..."
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addStep("steps")}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Добавить шаг
                </Button>
              </div>

              {/* Recommendations */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold">
                  Рекомендации ({data.exercise.recommendations.length})
                </Label>
                {data.exercise.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Рекомендация {i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeStep("recommendations", i)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Input
                      value={rec.title}
                      onChange={(e) =>
                        updateStep("recommendations", i, "title", e.target.value)
                      }
                      placeholder="Заголовок (напр. «Регулярность»)"
                    />
                    <Textarea
                      value={rec.body}
                      onChange={(e) =>
                        updateStep("recommendations", i, "body", e.target.value)
                      }
                      rows={3}
                      placeholder="Текст рекомендации..."
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addStep("recommendations")}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Добавить рекомендацию
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Affirmations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Аффирмации</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {data.affirmations.length} аффирмаций
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Фон карточек аффирмаций (URL)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={data.affirmationsBackground}
                    onChange={(e) =>
                      updateField("affirmationsBackground", e.target.value)
                    }
                    placeholder="https://... (по умолчанию — обложка состояния)"
                  />
                  {data.affirmationsBackground && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.affirmationsBackground}
                      alt="bg"
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                  )}
                </div>
              </div>
              {data.affirmations.map((text, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground pt-2 w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <Textarea
                    value={text}
                    onChange={(e) => updateAffirmation(i, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAffirmation(i)}
                    className="shrink-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addAffirmation}
                className="w-full"
              >
                <Plus className="size-4 mr-2" />
                Добавить аффирмацию
              </Button>
            </CardContent>
          </Card>

          {/* Linked meditations & webinars */}
          <Card>
            <CardHeader>
              <CardTitle>Вебинары и медитации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* External links (e.g. YouTube live) */}
              <div className="space-y-2">
                <Label className="text-xs">
                  Внешние ссылки (YouTube и др.)
                </Label>
                {data.externalLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={link.title}
                        onChange={(e) => updateLink(i, "title", e.target.value)}
                        placeholder="Название"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder="https://..."
                      />
                      <Input
                        value={link.image || ""}
                        onChange={(e) => updateLink(i, "image", e.target.value)}
                        placeholder="Обложка (URL, необязательно)"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(i)}
                      className="shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addLink}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Добавить ссылку
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  Медитации ({data.meditationIds.length})
                </Label>
                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {meditations.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={data.meditationIds.includes(m.id)}
                        onChange={() => toggleId("meditationIds", m.id)}
                      />
                      <span>{m.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  Вебинары ({data.webinarIds.length})
                </Label>
                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {webinars.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={data.webinarIds.includes(w.id)}
                        onChange={() => toggleId("webinarIds", w.id)}
                      />
                      <span>{w.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  Духовный завтрак (аудио по URL)
                </Label>
                <Input
                  value={data.breakfastTitle}
                  onChange={(e) =>
                    updateField("breakfastTitle", e.target.value)
                  }
                  placeholder="Название завтрака"
                />
                <Input
                  value={data.breakfastUrl}
                  onChange={(e) => updateField("breakfastUrl", e.target.value)}
                  placeholder="https://...mp3"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Духовный завтрак (из каталога музыки)
                </Label>
                <Select
                  value={data.audioId}
                  onValueChange={(val) => updateField("audioId", val as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите трек..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не выбрано</SelectItem>
                    {musicTracks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                        {t.artist ? ` — ${t.artist}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
