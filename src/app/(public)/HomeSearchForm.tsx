"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui";

export function HomeSearchForm() {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [cidade, setCidade] = useState("Belém - PA");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (termo) params.set("q", termo);
    if (cidade) params.set("cidade", cidade.split(" - ")[0]);
    router.push(`/buscar?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" size={18} />
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Pizzaria, eletricista, academia..."
          className="w-full rounded-xl py-3 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
        />
      </div>
      <div className="hidden h-8 w-px bg-ink-200 sm:block" />
      <div className="relative flex-1 border-t border-ink-100 pt-2 sm:border-0 sm:pt-0">
        <MapPin className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400 sm:top-[calc(50%+4px)]" size={18} />
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Belém - PA"
          className="w-full rounded-xl py-3 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
        />
      </div>
      <Button type="submit" size="lg" className="sm:shrink-0">
        BUSCAR
      </Button>
    </form>
  );
}
