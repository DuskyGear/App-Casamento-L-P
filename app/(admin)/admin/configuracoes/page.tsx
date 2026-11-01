import { createClient } from '@/lib/supabase/server';
import FormConfiguracoes from '@/components/admin/form-configuracoes';

export default async function Configuracoes() {
  const supabase = await createClient();
  const { data: lista } = await supabase
    .from('listas_presentes')
    .select('data_casamento')
    .order('criado_em')
    .limit(1)
    .maybeSingle();

  // converte o horário salvo para data e hora de Brasília (formato dos campos do formulário)
  let data = '';
  let hora = '16:00';
  if (lista?.data_casamento) {
    const [d, h] = new Date(lista.data_casamento).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).split(' ');
    data = d;
    hora = h.slice(0, 5);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-cacau/70">
          A data do casamento aparece como contagem regressiva no painel e na lista de presentes.
        </p>
      </div>
      <FormConfiguracoes data={data} hora={hora} />
    </div>
  );
}