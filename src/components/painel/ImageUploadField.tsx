"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface ImageUploadFieldProps {
  token: string | null;
  /** Pasta lógica pra organizar o upload (ex: "logo", "capa", "galeria", "produtos"). */
  pasta: string;
  label?: string;
  onUploaded: (url: string) => void;
  className?: string;
}

/** Botão de upload de imagem — envia pra POST /api/painel/upload e devolve a URL pública via onUploaded. */
export function ImageUploadField({ token, pasta, label = "Enviar imagem", onUploaded, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!token) return;
    setErro(null);
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pasta", pasta);
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
      onUploaded(json.data.url);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        icon={enviando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? "Enviando..." : label}
      </Button>
      {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
