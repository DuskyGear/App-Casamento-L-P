/** Catálogo de integrações. Para adicionar outra no futuro, inclua aqui e crie a página em /admin/integracoes/<id>. */
export const INTEGRACOES = [
  {
    id: 'mercadopago',
    nome: 'Mercado Pago',
    descricao: 'Checkout Pro: o convidado paga com Pix, cartão ou boleto em uma página segura do Mercado Pago.',
    disponivel: true,
  },
  { id: 'pagbank', nome: 'PagBank', descricao: 'Em breve.', disponivel: false },
  { id: 'stripe', nome: 'Stripe', descricao: 'Em breve.', disponivel: false },
] as const;