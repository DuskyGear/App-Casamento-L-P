/** Aparece na hora ao trocar de aba do painel, enquanto os dados carregam. */
export default function Carregando() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-56 rounded-xl bg-areia" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-areia" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-areia" />
    </div>
  );
}