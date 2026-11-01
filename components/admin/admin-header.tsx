'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminHeaderProps {
  sairAction: () => Promise<void>;
}

export default function AdminHeader({ sairAction }: AdminHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const linkClass =
    'whitespace-nowrap rounded-full px-4 py-2 text-sm hover:bg-areia focus-visible:ring-2 focus-visible:ring-terracota transition-colors';
  const mobileLinkClass =
    'block rounded-xl px-4 py-3 text-base font-medium hover:bg-areia focus-visible:ring-2 focus-visible:ring-terracota transition-colors';

  return (
    <header className="relative border-b border-ouro/30 bg-marfim">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        {/* Botão Hambúrguer (Mobile: Esquerda) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-cacau hover:bg-areia/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracota md:hidden"
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isOpen}
        >
          <svg
            className="h-6 w-6 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Título (Mobile: Direita | Desktop: Esquerda) */}
        <span className="font-display text-xl italic md:order-first">
          Nosso casamento
        </span>

        {/* Menu Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/admin" className={linkClass}>
            Painel
          </Link>
          <Link href="/admin/convidados" className={linkClass}>
            Convidados
          </Link>
          <Link href="/admin/padrinhos" className={linkClass}>
            Padrinhos
          </Link>
          <Link href="/admin/orcamentos" className={linkClass}>
            Orçamentos
          </Link>
          <Link href="/admin/presentes" className={linkClass}>
            Presentes
          </Link>
          <Link href="/admin/integracoes" className={linkClass}>
            Integrações
          </Link>
          <Link href="/admin/configuracoes" className={linkClass}>
            Configurações
          </Link>
          <form action={sairAction}>
            <button type="submit" className={linkClass}>
              Sair
            </button>
          </form>
        </nav>
      </div>

      {/* Menu Dropdown Mobile */}
      {isOpen && (
        <div className="border-b border-ouro/20 bg-marfim px-6 pb-6 pt-2 shadow-lg md:hidden">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/admin"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Painel
            </Link>
            <Link
              href="/admin/convidados"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Convidados
            </Link>
            <Link
              href="/admin/padrinhos"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Padrinhos
            </Link>
            <Link
              href="/admin/orcamentos"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Orçamentos
            </Link>
            <Link
              href="/admin/presentes"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Presentes
            </Link>
            <Link
              href="/admin/integracoes"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Integrações
            </Link>
            <Link
              href="/admin/configuracoes"
              className={mobileLinkClass}
              onClick={() => setIsOpen(false)}
            >
              Configurações
            </Link>
            <form action={sairAction} className="pt-2">
              <button
                type="submit"
                className="block w-full rounded-xl px-4 py-3 text-left font-medium text-terracota hover:bg-areia/50 transition-colors"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}