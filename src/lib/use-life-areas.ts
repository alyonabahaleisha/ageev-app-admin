"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { LIFE_AREAS, AREA_LABELS, LifeArea, LifeAreaDoc } from "./types";

/** Sentinel for "no area" in selects (Radix forbids empty-string item values). */
export const NO_AREA = "__none__";

/**
 * Effective life areas of a content item: the multi `areas` array when set,
 * otherwise the legacy single `area`. Writers must keep `area` = areas[0].
 */
export function itemAreas(i: { area?: string; areas?: string[] }): string[] {
  if (i.areas && i.areas.length) return i.areas;
  return i.area ? [i.area] : [];
}

/** Live list of life-area keys (built-in ∪ Firestore) with display labels. */
export function useLifeAreas() {
  const [areaDocs, setAreaDocs] = useState<Record<string, LifeAreaDoc>>({});

  useEffect(
    () =>
      onSnapshot(collection(db, "lifeAreas"), (snap) => {
        const data: Record<string, LifeAreaDoc> = {};
        snap.docs.forEach((d) => {
          data[d.id] = d.data() as LifeAreaDoc;
        });
        setAreaDocs(data);
      }),
    []
  );

  const areaKeys = [
    ...new Set<string>([...LIFE_AREAS, ...Object.keys(areaDocs)]),
  ].sort((a, b) => (areaDocs[a]?.sortOrder ?? 999) - (areaDocs[b]?.sortOrder ?? 999));

  const areaLabel = (key: string) =>
    areaDocs[key]?.label || AREA_LABELS[key as LifeArea] || key;

  return { areaKeys, areaLabel };
}
