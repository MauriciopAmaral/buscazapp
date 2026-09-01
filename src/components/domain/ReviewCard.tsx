import Image from "next/image";
import { Star, CornerDownRight } from "lucide-react";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink-100">
          {review.avatarUrl && (
            <Image src={review.avatarUrl} alt={review.autor} fill className="object-cover" unoptimized />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-sm font-semibold text-ink-900">{review.autor}</span>
            <span className="text-xs text-ink-400">{formatDate(review.data)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < review.nota ? "fill-amber-400 text-amber-400" : "text-ink-200"}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-600">{review.comentario}</p>

          {review.resposta && (
            <div className="mt-3 flex gap-2 rounded-xl bg-ink-50 p-3">
              <CornerDownRight size={14} className="mt-0.5 shrink-0 text-ink-400" />
              <div>
                <p className="text-xs font-semibold text-ink-700">Resposta da empresa</p>
                <p className="mt-0.5 text-xs text-ink-500">{review.resposta.texto}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
