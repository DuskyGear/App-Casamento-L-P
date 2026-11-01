'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { alternarAtivo } from '@/app/(admin)/admin/actions';
import { excluirPresente } from '@/app/(admin)/admin/presentes/actions';
import { Lapis, Lixeira, Lista, Olho, OlhoRiscado } from './icones';

/** Botões de ação (ícones) de um presente: editar, ver contribuições, ocultar/mostrar e excluir. */
export default function AcoesPresente({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const [ocupado, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const btn =
    'grid size-11 place-items-center rounded-full border border-ouro/40 text-cacau hover:bg-areia focus-visible:ring-2 focus-visible:ring-terracota disabled:opacity-40';

  return (
    <div>
      <div className="flex items-center justify-between gap-2 md:justify-end">
        <Link href={`/admin/presentes/${id}`} aria-label={`Editar ${nome}`} title="Editar" className={btn}>
          <Lapis />
        </Link>

        <Link href={`/admin/presentes/${id}/contribuicoes`} aria-label={`Ver contribuições de ${nome}`} title="Ver contribuições" className={btn}>
          <Lista />
        </Link>

        <button
          type="button"
          disabled={ocupado}
          aria-label={ativo ? `Ocultar ${nome} da lista pública` : `Mostrar ${nome} na lista pública`}
          title={ativo ? 'Ocultar da lista' : 'Mostrar na lista'}
          onClick={() => { setErro(null); iniciar(async () => { await alternarAtivo(id, !ativo); }); }}
          className={btn}
        >
          {ativo ? <OlhoRiscado /> : <Olho />}
        </button>

        <button
          type="button"
          disabled={ocupado}
          aria-label={`Excluir ${nome}`}
          title="Excluir"
          onClick={() => {
            if (!confirm(`Excluir “${nome}”? Esta ação não pode ser desfeita.`)) return;
            setErro(null);
            iniciar(async () => {
              const r = await excluirPresente(id);
              if (r.erro) setErro(r.erro);
            });
          }}
          className={`${btn} text-terracota`}
        >
          <Lixeira />
        </button>
      </div>

      {erro && <p role="alert" className="mt-2 text-xs text-terracota">{erro}</p>}
    </div>
  );
}