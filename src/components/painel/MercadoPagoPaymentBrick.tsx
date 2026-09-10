"use client";

// ============================================================
// Formulário de pagamento embutido do Mercado Pago (Payment Brick).
//
// Carrega o SDK oficial do Mercado Pago (https://sdk.mercadopago.com/js/v2)
// direto no navegador e renderiza o formulário de pagamento — cartão de
// crédito ou Pix — dentro da própria página do BuscaZapp. A empresa nunca
// sai do site: escolhe o meio de pagamento, preenche os dados e confirma
// ali mesmo.
//
// O Brick não é hospedado pelo BuscaZapp (é um script do próprio Mercado
// Pago, carregado no navegador de quem está pagando), então não tem
// nenhuma restrição relacionada a este projeto — é assim que a
// documentação oficial do Mercado Pago recomenda o "Checkout
// transparente" pra quem não quer redirecionar o cliente pra fora do site.
// ============================================================

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          type: "payment",
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

let sdkPromise: Promise<void> | null = null;

function carregarSdkMercadoPago(): Promise<void> {
  if (typeof window !== "undefined" && window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

interface Props {
  publicKey: string;
  amount: number;
  onSubmit: (formData: Record<string, unknown>) => Promise<void>;
  onError?: (mensagem: string) => void;
}

/** Formulário de pagamento (cartão de crédito ou Pix) do Mercado Pago, embutido na página. */
export function MercadoPagoPaymentBrick({ publicKey, amount, onSubmit, onError }: Props) {
  const [containerId] = useState(() => `mp-brick-${Math.random().toString(36).slice(2)}`);
  const [carregando, setCarregando] = useState(true);
  const brickRef = useRef<{ unmount: () => void } | null>(null);
  const onSubmitRef = useRef(onSubmit);
  const onErrorRef = useRef(onError);

  // Mantém as refs sempre com a versão mais recente das callbacks, sem
  // escrever nelas durante a renderização (só depois, no efeito).
  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelado = false;

    carregarSdkMercadoPago()
      .then(() => {
        if (cancelado || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        return mp.bricks().create("payment", containerId, {
          initialization: { amount },
          customization: {
            paymentMethods: {
              // Só cartão de crédito e Pix — sem boleto, débito ou saldo em
              // conta do Mercado Pago. O Brick não aceita "none" pra
              // desligar um meio de pagamento: é preciso OMITIR a chave por
              // completo (colocar "none" faz o Brick recusar a
              // configuração inteira e mostrar "Ocorreu um erro").
              creditCard: "all",
              bankTransfer: "all",
            },
          },
          callbacks: {
            // onReady e onError são obrigatórios pro Brick — sem os dois
            // ele recusa a inicialização com "Callbacks onReady and/or
            // onError are required".
            onReady: () => {
              if (!cancelado) setCarregando(false);
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) => {
              return onSubmitRef.current(formData);
            },
            onError: (error: { type?: string; message?: string; cause?: unknown }) => {
              console.error("[MercadoPagoPaymentBrick]", error);
              if (!cancelado) {
                setCarregando(false);
                // "cause" traz o motivo específico (ex: get_payment_methods_failed,
                // fields_setup_failed) — mostra na tela pra facilitar o diagnóstico,
                // em vez de só uma mensagem genérica.
                const detalhes = [error?.message, error?.cause ? JSON.stringify(error.cause) : null]
                  .filter(Boolean)
                  .join(" — ");
                onErrorRef.current?.(
                  `Não foi possível carregar o formulário de pagamento.${detalhes ? ` (${detalhes})` : ""}`
                );
              }
            },
          },
        });
      })
      .then((brick) => {
        if (cancelado) {
          brick?.unmount();
          return;
        }
        if (brick) brickRef.current = brick;
      })
      .catch((err) => {
        if (!cancelado) {
          setCarregando(false);
          onErrorRef.current?.(err?.message ?? "Não foi possível carregar o Mercado Pago.");
        }
      });

    return () => {
      cancelado = true;
      brickRef.current?.unmount();
      brickRef.current = null;
    };
  }, [publicKey, amount, containerId]);

  return (
    <div>
      {carregando && <p className="mb-3 text-xs text-ink-400">Carregando formulário de pagamento...</p>}
      <div id={containerId} />
    </div>
  );
}
