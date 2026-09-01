"use client";

import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { ImageUploadField } from "@/components/painel/ImageUploadField";
import { NoCompanyState } from "@/components/painel/NoCompanyState";
import { LoadingState } from "@/components/ui";
import { useCallback, useEffect, useState } from "react";

interface GalleryItem {
  id: string;
  url: string;
}

export default function FotosPage() {
  const { token } = useAuth();
  const { company, loading, refresh } = useCurrentCompanyLive();
  const [galeria, setGaleria] = useState<GalleryItem[]>([]);
  const [loadingGaleria, setLoadingGaleria] = useState(true);
  const [salvandoCapaLogo, setSalvandoCapaLogo] = useState<"logo" | "capa" | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [adicionandoGaleria, setAdicionandoGaleria] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarGaleria = useCallback(async () => {
    if (!token) return;
    setLoadingGaleria(true);
    try {
      const res = await fetch("/api/painel/gallery", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);
      if (json?.success) setGaleria(json.data);
    } catch {
      // mantém o que já tinha
    } finally {
      setLoadingGaleria(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega a galeria assim que o token estiver disponível
    carregarGaleria();
  }, [carregarGaleria]);

  const salvarCampo = async (campo: "logoUrl" | "capaUrl", url: string) => {
    if (!token) return;
    setSalvandoCapaLogo(campo === "logoUrl" ? "logo" : "capa");
    setErro(null);
    try {
      const res = await fetch("/api/painel/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [campo]: url }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível salvar a imagem.");
        return;
      }
      await refresh();
    } finally {
      setSalvandoCapaLogo(null);
    }
  };

  const adicionarNaGaleria = async (url: string) => {
    if (!token) return;
    setAdicionandoGaleria(true);
    setErro(null);
    try {
      const res = await fetch("/api/painel/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível adicionar a imagem na galeria.");
        return;
      }
      await carregarGaleria();
    } finally {
      setAdicionandoGaleria(false);
    }
  };

  const removerDaGaleria = async (imageId: string) => {
    if (!token) return;
    setRemovendo(imageId);
    try {
      const res = await fetch(`/api/painel/gallery/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await carregarGaleria();
    } finally {
      setRemovendo(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Fotos</h1>
        <div className="mt-6">
          <LoadingState rows={1} />
        </div>
      </div>
    );
  }

  if (!company) {
    return <NoCompanyState />;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Fotos</h1>
      <p className="text-sm text-ink-500">Fotos enviadas aqui ficam salvas na hospedagem e aparecem no seu perfil público.</p>

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
              {salvandoCapaLogo === "logo" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <Loader2 size={18} className="animate-spin text-brand-600" />
                </div>
              )}
              <Image src={company.logoUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <ImageUploadField
              token={token}
              pasta="logo"
              label="Trocar logo"
              onUploaded={(url) => salvarCampo("logoUrl", url)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Foto de capa</h2>
          <div className="relative h-32 w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
            {salvandoCapaLogo === "capa" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2 size={18} className="animate-spin text-brand-600" />
              </div>
            )}
            <Image src={company.capaUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <ImageUploadField
            token={token}
            pasta="capa"
            label="Trocar capa"
            onUploaded={(url) => salvarCampo("capaUrl", url)}
            className="mt-3"
          />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Galeria</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {loadingGaleria ? (
              <div className="col-span-full">
                <LoadingState rows={1} />
              </div>
            ) : (
              galeria.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                  <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                  <button
                    onClick={() => removerDaGaleria(img.id)}
                    disabled={removendo === img.id}
                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-ink-500 opacity-0 group-hover:opacity-100 disabled:opacity-100"
                  >
                    {removendo === img.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  </button>
                </div>
              ))
            )}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 text-ink-400 hover:border-brand-400 hover:text-brand-600">
              {adicionandoGaleria ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              <span className="text-xs font-medium">Adicionar</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={adicionandoGaleria}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !token) return;
                  setAdicionandoGaleria(true);
                  setErro(null);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("pasta", "galeria");
                    const res = await fetch("/api/painel/upload", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const json = await res.json().catch(() => null);
                    if (!res.ok || !json?.success) {
                      setErro(json?.error?.message ?? "Não foi possível enviar a imagem.");
                      return;
                    }
                    await adicionarNaGaleria(json.data.url);
                  } finally {
                    setAdicionandoGaleria(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
