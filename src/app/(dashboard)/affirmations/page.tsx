"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLifeAreas } from "@/lib/use-life-areas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X, FolderInput } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AffirmationsPage() {
  // Сферы и их названия берём из коллекции lifeAreas (раздел «Сферы жизни»),
  // чтобы переименования сфер сразу отражались и здесь.
  const { areaKeys, areaLabel } = useLifeAreas();
  const [selectedArea, setSelectedArea] = useState<string>("money");
  const [texts, setTexts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoaded(false);
      try {
        const snap = await getDoc(doc(db, "affirmations", selectedArea));
        if (snap.exists()) {
          setTexts(snap.data().texts || []);
        } else {
          setTexts([]);
        }
      } catch {
        setTexts([]);
      }
      setLoaded(true);
    }
    load();
  }, [selectedArea]);

  function updateText(index: number, value: string) {
    const next = [...texts];
    next[index] = value;
    setTexts(next);
  }

  function addText() {
    setTexts([...texts, ""]);
  }

  function removeText(index: number) {
    setTexts(texts.filter((_, i) => i !== index));
  }

  /**
   * Перенос аффирмации в другую сферу: текст дописывается в документ целевой
   * сферы и убирается из текущей. Обе записи происходят сразу (вместе с
   * несохранёнными правками текущей сферы), кнопка «Сохранить» не нужна.
   */
  async function moveText(index: number, targetArea: string) {
    const text = texts[index]?.trim();
    if (!text || targetArea === selectedArea) return;
    const nextTexts = texts
      .filter((_, i) => i !== index)
      .filter((t) => t.trim());
    setSaving(true);
    try {
      const targetSnap = await getDoc(doc(db, "affirmations", targetArea));
      const targetTexts: string[] = targetSnap.exists()
        ? targetSnap.data().texts || []
        : [];
      await Promise.all([
        setDoc(doc(db, "affirmations", selectedArea), { texts: nextTexts }),
        setDoc(doc(db, "affirmations", targetArea), {
          texts: [...targetTexts, text],
        }),
      ]);
      setTexts(nextTexts);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "affirmations", selectedArea), {
        texts: texts.filter((t) => t.trim()),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Аффирмации</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {areaKeys.map((area) => (
          <Badge
            key={area}
            variant={selectedArea === area ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedArea(area)}
          >
            {areaLabel(area)}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{areaLabel(selectedArea)}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {texts.length} аффирмаций
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!loaded ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : (
            <>
              {texts.map((text, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground pt-2 w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <Textarea
                    value={text}
                    onChange={(e) => updateText(i, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Select value="" onValueChange={(v) => v && moveText(i, v)}>
                    <SelectTrigger
                      className="w-9 shrink-0 px-2 [&>svg:last-child]:hidden"
                      title="Перенести в другую сферу"
                    >
                      <FolderInput className="size-4" />
                    </SelectTrigger>
                    <SelectContent>
                      {areaKeys
                        .filter((a) => a !== selectedArea)
                        .map((a) => (
                          <SelectItem key={a} value={a}>
                            → {areaLabel(a)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeText(i)}
                    className="shrink-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addText} className="w-full">
                <Plus className="size-4 mr-2" />
                Добавить аффирмацию
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
