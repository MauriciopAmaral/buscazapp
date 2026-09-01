"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Coords, GeoStatus, getBrowserLocation } from "@/lib/geo";

interface GeoContextValue {
  coords: Coords | null;
  status: GeoStatus;
  requestLocation: () => void;
}

const GeoContext = createContext<GeoContextValue | undefined>(undefined);

export function GeoProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  const requestLocation = () => {
    if (status === "loading") return;
    setStatus("loading");
    getBrowserLocation()
      .then((c) => {
        setCoords(c);
        setStatus("granted");
      })
      .catch((err: Error) => {
        setStatus(err.message === "unsupported" ? "unsupported" : "denied");
      });
  };

  const value = useMemo(() => ({ coords, status, requestLocation }), [coords, status]);

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo() {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error("useGeo deve ser usado dentro de GeoProvider");
  return ctx;
}
