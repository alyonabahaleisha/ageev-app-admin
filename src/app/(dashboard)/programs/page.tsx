"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LIFE_AREAS, AREA_LABELS, LifeArea, ProgramPair } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, Plus, X } from "lucide-react";

export default function ProgramsPage() {
  const [selectedArea, setSelectedArea] = useState<LifeArea>("money");
  const [pairs, setPairs] = useState<ProgramPair[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoaded(false);
      try {
        const snap = await getDoc(doc(db, "programs", selectedArea));
        if (snap.exists()) {
          setPairs(snap.data().pairs || []);
        } else {
          setPairs([]);
        }
      } catch {
        setPairs([]);
      }
      setLoaded(true);
    }
    load();
  }, [selectedArea]);

  function updatePair(index: number, field: keyof ProgramPair, value: string) {
    const next = [...pairs];
    next[index] = { ...next[index], [field]: value };
    setPairs(next);
  }

  function addPair() {
    setPairs([...pairs, { limiting: "", rewrite: "" }]);
  }

  function removePair(index: number) {
    setPairs(pairs.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "programs", selectedArea), {
        pairs: pairs.filter((p) => p.limiting.trim() || p.rewrite.trim()),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Скрытые программы</h1>
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
              {pairs.length} программ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loaded ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : (
            <>
              {pairs.map((pair, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePair(i)}
                    className="absolute top-2 right-2"
                  >
                    <X className="size-4" />
                  </Button>
                  <div className="space-y-1">
                    <Label className="text-xs text-red-500">
                      Ограничивающее убеждение
                    </Label>
                    <Textarea
                      value={pair.limiting}
                      onChange={(e) =>
                        updatePair(i, "limiting", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-green-600">
                      Новое убеждение
                    </Label>
                    <Textarea
                      value={pair.rewrite}
                      onChange={(e) =>
                        updatePair(i, "rewrite", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addPair} className="w-full">
                <Plus className="size-4 mr-2" />
                Добавить программу
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
