import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FormOrcamento from '@/components/admin/form-orcamento';
import { atualizarOrcamento } from '../actions';

export default async function EditarOrcamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: o } = await supabase
    .from('orcamentos')
    .select('*, fornecedores(cnpj, razao_social, nome_fantasia, email, telefone, municipio, uf)')
    .eq('id', id)
    .maybeSingle();
  if (!o) notFound();

  const f = o.fornecedores;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar orçamento</h1>
      <FormOrcamento
        action={atualizarOrcamento.bind(null, id)}
        inicial={{
          cnpj: f.cnpj,
          razao_social: f.razao_social,
          nome_fantasia: f.nome_fantasia ?? '',
          email: f.email ?? '',
          telefone: f.telefone ?? '',
          municipio: f.municipio ?? '',
          uf: f.uf ?? '',
          titulo: o.titulo,
          categoria: o.categoria,
          valor: Number(o.valor),
          data_orcamento: o.data_orcamento,
          validade: o.validade ?? '',
          status: o.status,
          observacoes: o.observacoes ?? '',
        }}
      />
    </div>
  );
}