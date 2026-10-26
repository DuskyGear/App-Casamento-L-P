import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FormPadrinho from '@/components/admin/form-padrinho';
import { atualizarPadrinho } from '../actions';

export default async function EditarPadrinho({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from('padrinhos').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar padrinho ou madrinha</h1>
      <FormPadrinho action={atualizarPadrinho.bind(null, id)} inicial={p} />
    </div>
  );
}