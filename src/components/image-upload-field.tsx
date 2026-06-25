"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/storage";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";

interface ImageUploadFieldProps {
  /** Current image URL. */
  value: string;
  /** Called with the new URL (after upload) or "" when cleared. */
  onChange: (url: string) => void;
  /** Field label shown above the control. */
  label?: string;
  /** Hint shown when no image is set. */
  hint?: string;
  /** Storage folder to upload into, e.g. "mindset/covers". */
  folder: string;
}

/**
 * Image picker that uploads to Firebase Storage and shows a preview thumbnail.
 * The underlying URL is stored but never shown — the user only sees the image.
 */
export function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  folder,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const url = await uploadFile(`${folder}/${Date.now()}_${safeName}`, file);
      onChange(url);
    } catch (err) {
      console.error("Image upload failed", err);
      alert("Не удалось загрузить изображение");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs">{label}</Label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex items-center gap-3">
        {value ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative group shrink-0"
            title="Заменить изображение"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="preview"
              className="w-16 h-16 rounded object-cover border"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="size-5 text-white" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 shrink-0"
            title="Загрузить изображение"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </button>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Upload className="size-4 mr-2" />
              )}
              {value ? "Заменить" : "Загрузить"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                title="Удалить изображение"
              >
                <X className="size-4 mr-1" />
                Удалить
              </Button>
            )}
          </div>
          {hint && !value && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      </div>
    </div>
  );
}
