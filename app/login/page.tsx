'use client';

import { useActionState } from 'react';
import { entrar } from './actions';

export default function Login() {
  const [estado, action, enviando] = useActionState(entrar, null);
  const campo =
    'w-full rounded-xl border border-ouro/40 bg-marfim px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';

  return (
    <main className="grid min-h-dvh place-items-center bg-marfim px-6 text-cacau">
      <form action={action} className="w-full max-w-sm space-y-5 rounded-3xl border border-ouro/30 bg-white/70 p-8">
        <div className="text-center">
          <h1 className="font-display text-3xl italic">Painel dos noivos</h1>
          <div className="mx-auto my-4 h-px w-16 bg-ouro" aria-hidden />
        </div>
        <input name="email" type="email" required autoComplete="email" placeholder="E-mail" aria-label="E-mail" className={campo} />
        <input name="senha" type="password" required autoComplete="current-password" placeholder="Senha" aria-label="Senha" className={campo} />
        {estado?.erro && (
          <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">
            {estado.erro}
          </p>
        )}
        <button disabled={enviando} className="w-full rounded-full bg-terracota px-5 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}