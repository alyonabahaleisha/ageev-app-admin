"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LIFE_AREAS, AREA_LABELS, LifeArea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AffirmationsPage() {
  const [selectedArea, setSelectedArea] = useState<LifeArea>("money");
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
        {LIFE_AREAS.map((area) => (
          <Badge
            key={area}
            variant={selectedArea === area ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedArea(area)}
          >
            {AREA_LABELS[area]}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{AREA_LABELS[selectedArea]}</span>
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
