import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ContadorCasamento from '@/components/contador-casamento';

// Computador: fixo no canto inferior direito. Celular: aparece abaixo do menu, no fluxo da página.
const posicao = 'mx-auto mt-4 w-fit md:fixed md:bottom-6 md:right-6 md:z-30 md:m-0';

export default async function ContadorAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('listas_presentes')
    .select('data_casamento')
    .order('criado_em')
    .limit(1)
    .maybeSingle();

  if (!data?.data_casamento) {
    return (
      <Link
        href="/admin/configuracoes"
        className={`block rounded-full border border-ouro/40 bg-marfim px-4 py-2 text-sm shadow ${posicao}`}
      >
        Definir a data do casamento
      </Link>
    );
  }
  return <ContadorCasamento data={data.data_casamento} className={posicao} />;
}