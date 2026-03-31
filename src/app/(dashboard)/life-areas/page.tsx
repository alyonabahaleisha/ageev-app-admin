"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LIFE_AREAS, LifeAreaDoc, LifeArea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save } from "lucide-react";

export default function LifeAreasPage() {
  const [areas, setAreas] = useState<Record<string, LifeAreaDoc>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "lifeAreas"), (snap) => {
      const data: Record<string, LifeAreaDoc> = {};
      snap.docs.forEach((d) => {
        data[d.id] = d.data() as LifeAreaDoc;
      });
      setAreas(data);
    });
  }, []);

  function updateArea(key: string, field: keyof LifeAreaDoc, value: string | number) {
    setAreas({
      ...areas,
      [key]: { ...areas[key], [field]: value },
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(areas).map(([key, data]) =>
          setDoc(doc(db, "lifeAreas", key), data)
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Сферы жизни</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ключ</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Эмодзи</TableHead>
            <TableHead>Цвет</TableHead>
            <TableHead className="w-16">Порядок</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LIFE_AREAS.map((key) => {
            const area = areas[key] || {
              label: "",
              emoji: "",
              color: "",
              sortOrder: 0,
            };
            return (
              <TableRow key={key}>
                <TableCell className="font-mono text-sm">{key}</TableCell>
                <TableCell>
                  <Input
                    value={area.label}
                    onChange={(e) => updateArea(key, "label", e.target.value)}
                    className="max-w-48"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={area.emoji}
                    onChange={(e) => updateArea(key, "emoji", e.target.value)}
                    className="w-16"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={area.color || "#000000"}
                      onChange={(e) =>
                        updateArea(key, "color", e.target.value)
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Input
                      value={area.color}
                      onChange={(e) =>
                        updateArea(key, "color", e.target.value)
                      }
                      className="w-24 font-mono text-xs"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={area.sortOrder}
                    onChange={(e) =>
                      updateArea(key, "sortOrder", parseInt(e.target.value) || 0)
                    }
                    className="w-16"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
