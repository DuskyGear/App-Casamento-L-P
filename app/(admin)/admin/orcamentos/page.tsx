import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import BotaoExcluir from '@/components/admin/botao-excluir';
import { formatarCnpj } from '@/lib/cnpj';
import { brl, dataBR, hojeISO } from '@/lib/formato';
import { CATEGORIAS, STATUS_ORCAMENTO } from '@/lib/orcamentos';
import { excluirOrcamento } from './actions';

// Define os tipos exatos retornados pelo Supabase para evitar o uso de 'any'
type FornecedorRelacao = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  telefone: string | null;
};

type OrcamentoItem = {
  id: string;
  titulo: string;
  categoria: keyof typeof CATEGORIAS;
  valor: number | string;
  validade: string | null;
  status: keyof typeof STATUS_ORCAMENTO;
  observacoes: string | null;
  fornecedores: FornecedorRelacao;
};

const selo: Record<string, string> = {
  em_analise: 'bg-petala',
  aprovado: 'bg-ouro/20',
  contratado: 'bg-ouro/40 font-semibold',
  recusado: 'bg-areia text-cacau/60',
};

export default async function Orcamentos({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection(); // Garante rota dinâmica no Next.js 16

  const { status } = await searchParams;
  const supabase = await createClient();

  // só as colunas usadas na tela (consulta mais leve)
  const { data } = await supabase
    .from('orcamentos')
    .select(
      'id, titulo, categoria, valor, validade, status, observacoes, fornecedores(cnpj, razao_social, nome_fantasia, telefone)',
    )
    .order('criado_em', { ascending: false });

  const todos = (data ?? []) as unknown as OrcamentoItem[];
  const hoje = hojeISO();

  const soma = (lista: OrcamentoItem[]) => lista.reduce((s, o) => s + Number(o.valor), 0);
  const fechados = todos.filter((o) => o.status === 'contratado');
  const aprovados = todos.filter((o) => o.status === 'aprovado');
  const stats = [
    ['Orçamentos', String(todos.length)],
    ['Em análise', String(todos.filter((o) => o.status === 'em_analise').length)],
    ['Contratado', brl(soma(fechados))],
    ['Aprovado (a contratar)', brl(soma(aprovados))],
  ];

  // comparativo por categoria (ignora recusados)
  const porCategoria = Object.entries(CATEGORIAS)
    .map(([chave, nome]) => {
      const itensCat = todos.filter((o) => o.categoria === chave && o.status !== 'recusado');
      const valores = itensCat.map((o) => Number(o.valor));
      return {
        nome,
        qtd: itensCat.length,
        menor: valores.length > 0 ? Math.min(...valores) : 0,
        maior: valores.length > 0 ? Math.max(...valores) : 0,
      };
    })
    .filter((c) => c.qtd > 0);

  const itens = status ? todos.filter((o) => o.status === status) : todos;

  const aba = (valor: string | undefined, texto: string) => {
    const ativa = status === valor;
    return (
      <Link
        key={texto}
        href={valor ? `/admin/orcamentos?status=${valor}` : '/admin/orcamentos'}
        aria-current={ativa ? 'page' : undefined}
        className={`rounded-full border px-4 py-1.5 text-sm ${
          ativa ? 'border-cacau bg-cacau text-marfim' : 'border-ouro/40'
        }`}
      >
        {texto}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Orçamentos</h1>
        <Link
          href="/admin/orcamentos/novo"
          className="rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2"
        >
          Novo orçamento
        </Link>
      </div>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([t, v]) => (
          <div key={t} className="rounded-2xl border border-ouro/30 bg-white/70 p-5">
            <p className="text-sm text-cacau/70">{t}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{v}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {aba(undefined, 'Todos')}
        {Object.entries(STATUS_ORCAMENTO).map(([k, v]) => aba(k, v))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-areia">
            <tr>
              {['Fornecedor', 'Serviço', 'Valor', 'Validade', 'Situação', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((o) => {
              const f = o.fornecedores;
              const vencido = o.validade && o.validade < hoje && o.status === 'em_analise';
              return (
                <tr key={o.id} className="border-b border-areia align-top last:border-0">
                  <td className="px-4 py-3">
                    {f.nome_fantasia || f.razao_social}
                    <span className="block text-xs text-cacau/60">{formatarCnpj(f.cnpj)}</span>
                    {f.telefone && <span className="block text-xs text-cacau/60">{f.telefone}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.titulo}
                    <span className="block text-xs text-cacau/60">{CATEGORIAS[o.categoria]}</span>
                    {o.observacoes && (
                      <span className="mt-1 block max-w-xs text-xs text-cacau/70 line-clamp-2">
                        {o.observacoes}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{brl(Number(o.valor))}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {dataBR(o.validade)}
                    {vencido && <span className="block text-xs text-terracota">Vencido</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${selo[o.status]}`}>
                      {STATUS_ORCAMENTO[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/orcamentos/${o.id}`} className="underline underline-offset-4">
                        Editar
                      </Link>
                      <BotaoExcluir acao={excluirOrcamento.bind(null, o.id)} nome={o.titulo} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-cacau/60">
                  {todos.length === 0
                    ? 'Nenhum orçamento ainda. Clique em “Novo orçamento”.'
                    : 'Nenhum orçamento com essa situação.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {porCategoria.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl">Comparativo por categoria</h2>
          <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-areia">
                <tr>
                  {['Categoria', 'Orçamentos', 'Menor valor', 'Maior valor'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porCategoria.map((c) => (
                  <tr key={c.nome} className="border-b border-areia last:border-0">
                    <td className="px-4 py-3">{c.nome}</td>
                    <td className="px-4 py-3">{c.qtd}</td>
                    <td className="px-4 py-3 tabular-nums">{brl(c.menor)}</td>
                    <td className="px-4 py-3 tabular-nums">{brl(c.maior)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}