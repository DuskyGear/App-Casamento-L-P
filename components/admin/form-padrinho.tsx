'use client';

import { useActionState } from 'react';
import Link from 'next/link';

type Estado = { erro?: string } | null;

export type PadrinhoForm = {
  nome: string;
  papel: 'padrinho' | 'madrinha';
  lado: 'noivo' | 'noiva';
  funcao: string | null;
  email: string | null;
  telefone: string | null;
  status_convite: 'pendente' | 'aceito' | 'recusado';
  observacoes: string | null;
};

export default function FormPadrinho({
  action,
  inicial,
}: {
  action: (prev: Estado, fd: FormData) => Promise<Estado>;
  inicial?: PadrinhoForm;
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
          <label htmlFor="papel" className={rotulo}>Padrinho ou madrinha</label>
          <select id="papel" name="papel" defaultValue={inicial?.papel ?? 'padrinho'} className={campo}>
            <option value="padrinho">Padrinho</option>
            <option value="madrinha">Madrinha</option>
          </select>
        </div>
        <div>
          <label htmlFor="lado" className={rotulo}>Lado</label>
          <select id="lado" name="lado" defaultValue={inicial?.lado ?? 'noivo'} className={campo}>
            <option value="noivo">Noivo</option>
            <option value="noiva">Noiva</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="funcao" className={rotulo}>Função (opcional)</label>
        <input id="funcao" name="funcao" list="funcoes" placeholder="Ex.: Padrinho da aliança" defaultValue={inicial?.funcao ?? ''} className={campo} />
        <datalist id="funcoes">
          <option value="Padrinho de honra" /><option value="Madrinha de honra" />
          <option value="Padrinho da aliança" /><option value="Madrinha da aliança" />
          <option value="Padrinho de casamento" /><option value="Madrinha de casamento" />
        </datalist>
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

      <div>
        <label htmlFor="status_convite" className={rotulo}>Convite para ser padrinho</label>
        <select id="status_convite" name="status_convite" defaultValue={inicial?.status_convite ?? 'pendente'} className={campo}>
          <option value="pendente">Ainda não respondeu</option>
          <option value="aceito">Aceitou</option>
          <option value="recusado">Recusou</option>
        </select>
      </div>

      <div>
        <label htmlFor="observacoes" className={rotulo}>Observações (opcional)</label>
        <textarea id="observacoes" name="observacoes" rows={3} defaultValue={inicial?.observacoes ?? ''} className={campo} />
      </div>

      {estado?.erro && (
        <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>
      )}

      <div className="flex gap-3">
        <Link href="/admin/padrinhos" className="rounded-full border border-ouro/40 px-6 py-3 focus-visible:ring-2 focus-visible:ring-terracota">Cancelar</Link>
        <button disabled={enviando} className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {enviando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Adicionar padrinho'}
        </button>
      </div>
    </form>
  );
}