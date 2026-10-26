'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';

type Estado = { erro?: string } | null;

export type PresenteForm = {
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  tipo: 'unitario' | 'coletivo';
  valor_meta: number;
  valor_minimo_contribuicao: number;
  ordem: number;
  ativo: boolean;
};

const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FormPresente({
  action,
  inicial,
}: {
  action: (prev: Estado, fd: FormData) => Promise<Estado>;
  inicial?: PresenteForm;
}) {
  const editando = !!inicial;
  const [estado, formAction, enviando] = useActionState(action, null);
  const [tipo, setTipo] = useState<'unitario' | 'coletivo'>(inicial?.tipo ?? 'unitario');

  const campo =
    'w-full rounded-xl border border-ouro/40 bg-white/70 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';
  const rotulo = 'mb-1 block text-sm font-medium';

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {/* Tipo */}
      <fieldset>
        <legend className={rotulo}>Tipo de presente</legend>
        {editando ? (
          <p className="text-sm">
            {tipo === 'coletivo' ? 'Financiamento coletivo' : 'Unitário'}{' '}
            <span className="text-cacau/60">(o tipo não pode ser alterado depois de criado)</span>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['unitario', 'Unitário', 'Valor fechado, comprado por uma pessoa.'],
                ['coletivo', 'Financiamento coletivo', 'Meta em cotas; vários convidados contribuem.'],
              ] as const
            ).map(([v, titulo, desc]) => (
              <label
                key={v}
                className={`cursor-pointer rounded-2xl border p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-terracota ${
                  tipo === v ? 'border-terracota bg-petala/50' : 'border-ouro/40'
                }`}
              >
                <input type="radio" name="tipo" value={v} checked={tipo === v} onChange={() => setTipo(v)} className="sr-only" />
                <span className="font-display text-lg">{titulo}</span>
                <span className="mt-1 block text-sm text-cacau/70">{desc}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="nome" className={rotulo}>Nome</label>
        <input id="nome" name="nome" required minLength={2} defaultValue={inicial?.nome} className={campo} />
      </div>

      <div>
        <label htmlFor="descricao" className={rotulo}>Descrição</label>
        <textarea id="descricao" name="descricao" rows={3} defaultValue={inicial?.descricao ?? ''} className={campo} />
      </div>

      <div>
        <label htmlFor="imagem_url" className={rotulo}>Link da imagem (opcional)</label>
        <input id="imagem_url" name="imagem_url" type="url" placeholder="https://…" defaultValue={inicial?.imagem_url ?? ''} className={campo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="valor_meta" className={rotulo}>
            {tipo === 'coletivo' ? 'Meta a arrecadar (R$)' : 'Valor do presente (R$)'}
          </label>
          <input id="valor_meta" name="valor_meta" required inputMode="decimal" placeholder="Ex.: 389,90"
            defaultValue={inicial ? fmt(inicial.valor_meta) : ''} className={campo} />
        </div>
        {tipo === 'coletivo' && (
          <div>
            <label htmlFor="min" className={rotulo}>Contribuição mínima (R$)</label>
            <input id="min" name="valor_minimo_contribuicao" required inputMode="decimal" placeholder="Ex.: 50,00"
              defaultValue={inicial ? fmt(inicial.valor_minimo_contribuicao) : '50,00'} className={campo} />
          </div>
        )}
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ordem" className={rotulo}>Ordem na lista (menor aparece primeiro)</label>
          <input id="ordem" name="ordem" type="number" defaultValue={inicial?.ordem ?? 0} className={campo} />
        </div>
        <label className="flex items-center gap-3 py-3">
          <input type="checkbox" name="ativo" defaultChecked={inicial?.ativo ?? true} className="size-5 accent-terracota" />
          Visível na lista pública
        </label>
      </div>

      {estado?.erro && (
        <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>
      )}

      <div className="flex gap-3">
        <Link href="/admin/presentes" className="rounded-full border border-ouro/40 px-6 py-3 focus-visible:ring-2 focus-visible:ring-terracota">
          Cancelar
        </Link>
        <button disabled={enviando}
          className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar presente'}
        </button>
      </div>
    </form>
  );
}