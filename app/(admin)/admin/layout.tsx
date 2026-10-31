import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sair } from './actions';
import AdminHeader from '@/components/admin/admin-header';

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

  return (
    <div className="min-h-dvh bg-marfim text-cacau">
      <AdminHeader sairAction={sair} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}