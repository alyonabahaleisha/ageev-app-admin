"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoryQuoteDoc } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_AUTHOR = "Михаил Агеев";

export function QuotesTab() {
  const [quotes, setQuotes] = useState<StoryQuoteDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "storyQuotes"), orderBy("sortOrder"))
      );
      setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryQuoteDoc)));
      setLoading(false);
    })();
  }, []);

  async function persist(q: StoryQuoteDoc) {
    const { id, ...rest } = q;
    await setDoc(doc(db, "storyQuotes", id), rest);
  }

  function patch(id: string, changes: Partial<StoryQuoteDoc>) {
    setQuotes((prev) => {
      const next = prev.map((q) => (q.id === id ? { ...q, ...changes } : q));
      const target = next.find((q) => q.id === id);
      if (target) persist(target);
      return next;
    });
  }

  async function addQuote() {
    const id = `quote_${Date.now()}`;
    const newQuote: StoryQuoteDoc = {
      id,
      text: "",
      author: DEFAULT_AUTHOR,
      sortOrder: quotes.length,
    };
    await setDoc(doc(db, "storyQuotes", id), {
      text: "",
      author: DEFAULT_AUTHOR,
      sortOrder: quotes.length,
    });
    setQuotes((prev) => [...prev, newQuote]);
  }

  async function removeQuote(id: string) {
    if (!confirm("Удалить цитату?")) return;
    await deleteDoc(doc(db, "storyQuotes", id));
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Цитаты для первого сторис. Автор по умолчанию — «{DEFAULT_AUTHOR}».
      </p>
      <div className="space-y-3">
        {quotes.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Цитата</Label>
                <Textarea
                  defaultValue={q.text}
                  rows={2}
                  onBlur={(e) =>
                    e.target.value !== q.text &&
                    patch(q.id, { text: e.target.value })
                  }
                  placeholder="Интерес — это голос высшего «Я»..."
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Автор</Label>
                  <Input
                    defaultValue={q.author}
                    onBlur={(e) =>
                      e.target.value !== q.author &&
                      patch(q.id, { author: e.target.value })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeQuote(q.id)}
                >
                  <Trash2 className="size-4 mr-1" />
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={addQuote}>
        <Plus className="size-4 mr-2" />
        Добавить цитату
      </Button>
    </div>
  );
}
