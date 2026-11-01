'use client';

import { useEffect, useState } from 'react';

/**
 * Contagem regressiva para o casamento (atualiza a cada segundo).
 * O posicionamento é decidido por quem usa, via `className`
 * (no computador: fixo no canto inferior direito; no celular: no fluxo da página).
 */
export default function ContadorCasamento({ data, className = '' }: { data: string; className?: string }) {
  const alvo = new Date(data).getTime();
  const [agora, setAgora] = useState<number | null>(null);

  // só começa a contar depois de carregar no navegador (evita divergência entre servidor e navegador)
  useEffect(() => {
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (Number.isNaN(alvo)) return null;

  const diff = agora === null ? null : alvo - agora;
  const chegou = diff !== null && diff <= 0;
  const pad = (n: number) => String(n).padStart(2, '0');

  const partes =
    diff === null || chegou
      ? null
      : {
          dias: Math.floor(diff / 86_400_000),
          horas: Math.floor((diff % 86_400_000) / 3_600_000),
          minutos: Math.floor((diff % 3_600_000) / 60_000),
          segundos: Math.floor((diff % 60_000) / 1000),
        };

  const itens: [string, string][] = [
    ['dias', partes ? String(partes.dias) : '–'],
    ['horas', partes ? pad(partes.horas) : '–'],
    ['min', partes ? pad(partes.minutos) : '–'],
    ['seg', partes ? pad(partes.segundos) : '–'],
  ];

  return (
    <aside
      aria-label="Contagem regressiva para o casamento"
      className={`rounded-2xl border border-ouro/40 bg-marfim/95 px-5 py-4 text-center text-cacau shadow-lg backdrop-blur ${className}`}
    >
      {chegou ? (
        <p className="font-display text-xl italic">O grande dia chegou!</p>
      ) : (
        <>
          <p className="text-xs text-cacau/70">Faltam para o grande dia</p>
          <div role="timer" className="mt-2 flex justify-center gap-4">
            {itens.map(([rotulo, valor]) => (
              <div key={rotulo} className="min-w-10">
                <span className="block font-display text-3xl leading-none tabular-nums">{valor}</span>
                <span className="mt-1 block text-xs text-cacau/70">{rotulo}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="mt-2 min-h-4 text-xs text-cacau/70">
        {agora !== null &&
          new Date(alvo).toLocaleDateString('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' })}
      </p>
    </aside>
  );
}