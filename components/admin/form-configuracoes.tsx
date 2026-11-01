'use client';

import { useActionState } from 'react';
import { salvarConfiguracoes } from '@/app/(admin)/admin/configuracoes/actions';

type Estado = { erro?: string; ok?: string } | null;

export default function FormConfiguracoes({ data, hora }: { data: string; hora: string }) {
  const [estado, action, salvando] = useActionState<Estado, FormData>(salvarConfiguracoes, null);
  const campo =
    'w-full rounded-xl border border-ouro/40 bg-white/70 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';

  return (
    <form action={action} className="max-w-md space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="data" className="mb-1 block text-sm font-medium">Data do casamento</label>
          <input id="data" name="data" type="date" required defaultValue={data} className={campo} />
        </div>
        <div>
          <label htmlFor="hora" className="mb-1 block text-sm font-medium">Horário</label>
          <input id="hora" name="hora" type="time" defaultValue={hora} className={campo} />
        </div>
      </div>

      {estado?.erro && <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="rounded-xl bg-ouro/15 px-4 py-3 text-sm">{estado.ok}</p>}

      <div className="flex flex-wrap gap-3">
        <button disabled={salvando}
          className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        {data && (
          <button name="acao" value="remover" formNoValidate disabled={salvando}
            className="rounded-full border border-ouro/40 px-6 py-3 focus-visible:ring-2 focus-visible:ring-terracota disabled:opacity-50">
            Remover data
          </button>
        )}
      </div>
    </form>
  );
}