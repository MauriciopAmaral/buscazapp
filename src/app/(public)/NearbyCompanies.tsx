"use client";

import { useMemo } from "react";
import { LocateFixed, LoaderCircle } from "lucide-react";
import { CompanyCard } from "@/components/domain";
import { Button } from "@/components/ui";
import { Company } from "@/types";
import { useGeo } from "@/context/GeoContext";
import { distanceKm } from "@/lib/geo";

export function NearbyCompanies({ companies }: { companies: Company[] }) {
  const { coords, status, requestLocation } = useGeo();

  const ordered = useMemo(() => {
    if (!coords) return companies;
    return [...companies].sort(
      (a, b) =>
        distanceKm(coords, { lat: a.endereco.latitude, lng: a.endereco.longitude }) -
        distanceKm(coords, { lat: b.endereco.latitude, lng: b.endereco.longitude })
    );
  }, [companies, coords]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          variant={status === "granted" ? "outline" : "ghost"}
          size="sm"
          icon={status === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          onClick={requestLocation}
          disabled={status === "loading"}
        >
          {status === "granted"
            ? "Ordenado por distância"
            : status === "denied"
              ? "Permissão negada — tentar de novo"
              : "Ver as mais próximas de mim"}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}
