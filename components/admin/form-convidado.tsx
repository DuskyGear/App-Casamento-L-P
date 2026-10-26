'use client';

import { useActionState } from 'react';
import Link from 'next/link';

type Estado = { erro?: string } | null;

export type ConvidadoForm = {
  nome: string;
  email: string | null;
  telefone: string | null;
  lado: 'noiva' | 'noivo' | 'ambos';
  grupo: string | null;
  acompanhantes: number;
  status_rsvp: 'pendente' | 'confirmado' | 'recusado';
  restricao_alimentar: string | null;
  observacoes: string | null;
};

export default function FormConvidado({
  action,
  inicial,
}: {
  action: (prev: Estado, fd: FormData) => Promise<Estado>;
  inicial?: ConvidadoForm;
}) {
  const [estado, formAction, enviando] = useActionState(action, null);
  const campo =
    'w-full rounded-xl border border-ouro/40 bg-white/70 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';
  const rotulo = 'mb-1 block text-sm font-medium';

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="nome" className={rotulo}>Nome</label>
        <input id="nome" name="nome" required minLength={2} defaultValue={inicial?.nome} className={campo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={rotulo}>E-mail (opcional)</label>
          <input id="email" name="email" type="email" defaultValue={inicial?.email ?? ''} className={campo} />
        </div>
        <div>
          <label htmlFor="telefone" className={rotulo}>Telefone / WhatsApp (opcional)</label>
          <input id="telefone" name="telefone" type="tel" defaultValue={inicial?.telefone ?? ''} className={campo} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="lado" className={rotulo}>Lado</label>
          <select id="lado" name="lado" defaultValue={inicial?.lado ?? 'ambos'} className={campo}>
            <option value="noiva">Noiva</option>
            <option value="noivo">Noivo</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
        <div>
          <label htmlFor="grupo" className={rotulo}>Grupo</label>
          <input id="grupo" name="grupo" list="grupos" placeholder="Ex.: Família" defaultValue={inicial?.grupo ?? ''} className={campo} />
          <datalist id="grupos">
            <option value="Família" /><option value="Amigos" /><option value="Trabalho" /><option value="Faculdade" /><option value="Vizinhos" />
          </datalist>
        </div>
        <div>
          <label htmlFor="acompanhantes" className={rotulo}>Acompanhantes</label>
          <input id="acompanhantes" name="acompanhantes" type="number" min={0} max={20} defaultValue={inicial?.acompanhantes ?? 0} className={campo} />
        </div>
      </div>

      <div>
        <label htmlFor="status_rsvp" className={rotulo}>Confirmação de presença</label>
        <select id="status_rsvp" name="status_rsvp" defaultValue={inicial?.status_rsvp ?? 'pendente'} className={campo}>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="recusado">Não vai</option>
        </select>
      </div>

      <div>
        <label htmlFor="restricao_alimentar" className={rotulo}>Restrição alimentar (opcional)</label>
        <input id="restricao_alimentar" name="restricao_alimentar" placeholder="Ex.: vegetariano, sem glúten" defaultValue={inicial?.restricao_alimentar ?? ''} className={campo} />
      </div>

      <div>
        <label htmlFor="observacoes" className={rotulo}>Observações (opcional)</label>
        <textarea id="observacoes" name="observacoes" rows={3} defaultValue={inicial?.observacoes ?? ''} className={campo} />
      </div>

      {estado?.erro && (
        <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>
      )}

      <div className="flex gap-3">
        <Link href="/admin/convidados" className="rounded-full border border-ouro/40 px-6 py-3 focus-visible:ring-2 focus-visible:ring-terracota">Cancelar</Link>
        <button disabled={enviando} className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {enviando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Adicionar convidado'}
        </button>
      </div>
    </form>
  );
}