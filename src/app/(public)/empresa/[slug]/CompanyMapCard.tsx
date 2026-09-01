"use client";

import { MapPin, Navigation } from "lucide-react";
import { Endereco } from "@/types";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, wazeUrl, uberUrl, distanceKm, formatDistance } from "@/lib/geo";
import { useGeo } from "@/context/GeoContext";

// Ícones das marcas mantidos como SVG simples (a versão do lucide-react
// deste projeto não inclui os logos de terceiros).
function WazeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.03 2 11c0 2.55 1.19 4.85 3.1 6.49-.06.5-.22 1.36-.6 2.06a.5.5 0 00.58.71c1-.27 2.13-.79 2.8-1.14A10.9 10.9 0 0012 20c5.52 0 10-4.03 10-9s-4.48-9-10-9zm-3.5 8a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm7 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm-6.2 2.2a.6.6 0 01.85-.06c.55.47 1.36.86 2.35.86s1.8-.39 2.35-.86a.6.6 0 11.79.9c-.73.64-1.83 1.16-3.14 1.16s-2.41-.52-3.14-1.16a.6.6 0 01-.06-.84z" />
    </svg>
  );
}

function UberIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M3 3h4.2v10.8c0 2.65 1.9 4.4 4.8 4.4s4.8-1.75 4.8-4.4V3H21v10.9c0 4.75-3.55 7.9-9 7.9s-9-3.15-9-7.9V3z" />
    </svg>
  );
}

export function CompanyMapCard({
  endereco,
  nomeFantasia,
}: {
  endereco: Endereco;
  nomeFantasia: string;
}) {
  const { coords } = useGeo();
  const dest = { lat: endereco.latitude, lng: endereco.longitude };
  const distancia = coords ? distanceKm(coords, dest) : null;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
        <MapPin size={16} className="text-ink-400" />
        Endereço
        {distancia !== null && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-700">
            <Navigation size={12} />
            {formatDistance(distancia)} de você
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-600">
        {endereco.logradouro}, {endereco.numero}
        {endereco.complemento ? ` — ${endereco.complemento}` : ""}
        <br />
        {endereco.bairro}, {endereco.cidade} - {endereco.estado}
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-ink-100">
        <iframe
          title={`Mapa — ${nomeFantasia}`}
          src={googleMapsEmbedUrl(dest, nomeFantasia)}
          width="100%"
          height="180"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a
          href={googleMapsDirectionsUrl(dest)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
        >
          <Navigation size={15} />
          Rota
        </a>
        <a
          href={wazeUrl(dest)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
        >
          <WazeIcon />
          Waze
        </a>
        <a
          href={uberUrl(dest, nomeFantasia)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
        >
          <UberIcon />
          Uber
        </a>
      </div>
    </div>
  );
}
