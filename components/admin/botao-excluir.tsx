'use client';

/** Botão de excluir com confirmação do navegador. */
export default function BotaoExcluir({ acao, nome }: { acao: () => Promise<void>; nome: string }) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(`Excluir “${nome}”? Esta ação não pode ser desfeita.`)) e.preventDefault();
      }}
    >
      <button className="text-terracota underline underline-offset-4">Excluir</button>
    </form>
  );
}