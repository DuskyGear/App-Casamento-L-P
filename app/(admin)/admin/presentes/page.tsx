import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { alternarAtivo } from '../actions';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function Presentes() {
  const supabase = await createClient();
  const { data } = await supabase.from('presentes').select('*').order('ordem').order('criado_em');
  const itens = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Presentes</h1>
        <Link href="/admin/presentes/novo"
          className="rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2">
          Novo presente
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-areia">
            <tr>{['Presente', 'Tipo', 'Meta / valor', 'Arrecadado', 'Situação', ''].map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {itens.map((p) => (
              <tr key={p.id} className="border-b border-areia last:border-0">
                <td className="px-4 py-3">{p.nome}</td>
                <td className="px-4 py-3">{p.tipo === 'coletivo' ? 'Coletivo' : 'Unitário'}</td>
                <td className="px-4 py-3 tabular-nums">{brl(Number(p.valor_meta))}</td>
                <td className="px-4 py-3 tabular-nums">{brl(Number(p.valor_arrecadado))}</td>
                <td className="px-4 py-3">
                  {p.status === 'quitado' ? 'Concluído' : p.ativo ? 'Visível' : 'Oculto'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/presentes/${p.id}`} className="underline underline-offset-4">Editar</Link>
                    <form action={alternarAtivo.bind(null, p.id, !p.ativo)}>
                      <button className="underline underline-offset-4">{p.ativo ? 'Ocultar' : 'Mostrar'}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-cacau/60">Nenhum presente ainda. Clique em “Novo presente”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}