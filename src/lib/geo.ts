// ============================================================
// BuscaZapp — utilitários de geolocalização
// Distância entre coordenadas (Haversine) e links para abrir
// rotas em apps externos (Google Maps, Waze, Uber).
// ============================================================

export interface Coords {
  lat: number;
  lng: number;
}

/** Distância em quilômetros entre duas coordenadas, usando a fórmula de Haversine. */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371; // raio da Terra em km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Link do Google Maps para traçar rota até o destino. */
export function googleMapsDirectionsUrl(dest: Coords) {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
}

/** Link de embed do Google Maps (sem necessidade de API key) centrado no destino. */
export function googleMapsEmbedUrl(dest: Coords, label?: string) {
  const query = label ? `${label}@${dest.lat},${dest.lng}` : `${dest.lat},${dest.lng}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

/** Deep link universal do Waze (funciona no app ou abre o site em fallback). */
export function wazeUrl(dest: Coords) {
  return `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
}

/** Deep link universal do Uber para solicitar corrida com destino pré-definido. */
export function uberUrl(dest: Coords, nickname?: string) {
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": "my_location",
    "dropoff[latitude]": String(dest.lat),
    "dropoff[longitude]": String(dest.lng),
  });
  if (nickname) params.set("dropoff[nickname]", nickname);
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export type GeoStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

/** Wrapper em Promise para a API nativa de geolocalização do navegador. */
export function getBrowserLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("denied")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
