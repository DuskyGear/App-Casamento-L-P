import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FormConvidado from '@/components/admin/form-convidado';
import { atualizarConvidado } from '../actions';

export default async function EditarConvidado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from('convidados').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar convidado</h1>
      <FormConvidado action={atualizarConvidado.bind(null, id)} inicial={c} />
    </div>
  );
}