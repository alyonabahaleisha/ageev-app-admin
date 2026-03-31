"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Save, Plus, X, Search } from "lucide-react";

export default function UIStringsPage() {
  const [strings, setStrings] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "config", "ui_strings"));
        if (snap.exists()) {
          setStrings(snap.data() as Record<string, string>);
        }
      } catch {
        // not configured yet
      }
    }
    load();
  }, []);

  function updateString(key: string, value: string) {
    setStrings({ ...strings, [key]: value });
  }

  function removeString(key: string) {
    const next = { ...strings };
    delete next[key];
    setStrings(next);
  }

  function addString() {
    if (newKey.trim()) {
      setStrings({ ...strings, [newKey.trim()]: newValue });
      setNewKey("");
      setNewValue("");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "ui_strings"), strings);
    } finally {
      setSaving(false);
    }
  }

  const filtered = Object.entries(strings)
    .filter(
      ([k, v]) =>
        k.toLowerCase().includes(filter.toLowerCase()) ||
        v.toLowerCase().includes(filter.toLowerCase())
    )
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">UI тексты</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ключу или значению..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Новый ключ"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Значение"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={addString}>
          <Plus className="size-4" />
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Ключ</TableHead>
            <TableHead>Значение</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-mono text-xs">{key}</TableCell>
              <TableCell>
                <Input
                  value={value}
                  onChange={(e) => updateString(key, e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeString(key)}
                >
                  <X className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground py-8"
              >
                {filter ? "Ничего не найдено" : "Нет UI текстов. Запустите seed-скрипт."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
