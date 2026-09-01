"use client";

import { useEffect, useState } from "react";
import { Star, Send } from "lucide-react";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default function AvaliacoesPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/painel/reviews", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setReviews(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const media =
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.nota, 0) / reviews.length).toFixed(1) : "0.0";

  const responder = async (id: string) => {
    const texto = drafts[id];
    if (!texto || !token) return;
    setSending(id);
    try {
      const res = await fetch(`/api/painel/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setReviews((prev) => prev.map((r) => (r.id === id ? json.data : r)));
        setDrafts((prev) => ({ ...prev, [id]: "" }));
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Avaliações</h1>
          <p className="text-sm text-ink-500">Veja o que seus clientes estão dizendo.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-2">
          <Star size={18} className="fill-amber-400 text-amber-400" />
          <span className="text-lg font-bold text-ink-900">{media}</span>
          <span className="text-xs text-ink-400">({reviews.length} avaliações)</span>
        </div>
      </div>

      {loading ? (
        <LoadingState className="mt-6" rows={2} />
      ) : reviews.length === 0 ? (
        <EmptyState className="mt-6" title="Nenhuma avaliação recebida ainda" />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink-100">
                  {r.avatarUrl && <Image src={r.avatarUrl} alt="" fill className="object-cover" unoptimized />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-ink-900">{r.autor}</span>
                    <span className="text-xs text-ink-400">{formatDate(r.data)}</span>
                  </div>
                  <div className="mt-0.5 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < r.nota ? "fill-amber-400 text-amber-400" : "text-ink-200"} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{r.comentario}</p>

                  {r.resposta ? (
                    <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
                      <p className="mb-0.5 font-semibold text-ink-700">Sua resposta</p>
                      {r.resposta.texto}
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={drafts[r.id] ?? ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Responder avaliação..."
                        className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                      <Button size="sm" icon={<Send size={13} />} onClick={() => responder(r.id)} disabled={sending === r.id}>
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
