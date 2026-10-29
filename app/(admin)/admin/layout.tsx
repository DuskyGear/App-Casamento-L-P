import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sair } from './actions';

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: ehAdmin } = await supabase.rpc('is_admin');

  if (!ehAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center bg-marfim px-6 text-center text-cacau">
        <div className="max-w-sm space-y-4">
          <h1 className="font-display text-2xl">Sem permissão</h1>
          <p className="text-sm text-cacau/70">
            Este usuário não está na lista de administradores.
          </p>
          <form action={sair}>
            <button className="rounded-full border border-terracota px-5 py-2 text-terracota">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  const link =
    'rounded-full px-4 py-2 text-sm hover:bg-areia focus-visible:ring-2 focus-visible:ring-terracota';

  return (
    <div className="min-h-dvh bg-marfim text-cacau">
      <header className="border-b border-ouro/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <span className="font-display text-xl italic">Nosso casamento</span>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <Link href="/admin" className={link}>
              Painel
            </Link>
            <Link href="/admin/orcamentos" className={link}>
              Orçamentos
            </Link>
            <Link href="/admin/presentes" className={link}>
              Presentes
            </Link>
            <Link href="/admin/convidados" className={link}>Convidados
            </Link>
            <Link href="/admin/padrinhos" className={link}>Padrinhos
            </Link>
            <Link href="/admin/integracoes" className={link}>Integrações
            </Link>
            <form action={sair}>
              <button className={link}>Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}