"use client";

import Image from "next/image";
import { Upload, X, ImagePlus } from "lucide-react";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { Button } from "@/components/ui";

export default function FotosPage() {
  const company = useCurrentCompany();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Fotos</h1>
      <p className="text-sm text-ink-500">Uploads são apenas simulados neste protótipo.</p>

      <div className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
              <Image src={company.logoUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <Button variant="outline" icon={<Upload size={16} />}>
              Trocar logo
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Foto de capa</h2>
          <div className="relative h-32 w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
            <Image src={company.capaUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <Button variant="outline" icon={<Upload size={16} />} className="mt-3">
            Trocar capa
          </Button>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Galeria</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {company.galeria.map((img, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                <Image src={img} alt="" fill className="object-cover" unoptimized />
                <button className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-ink-500 opacity-0 group-hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 text-ink-400 hover:border-brand-400 hover:text-brand-600">
              <ImagePlus size={20} />
              <span className="text-xs font-medium">Adicionar</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
