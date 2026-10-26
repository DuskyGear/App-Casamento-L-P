import FormOrcamento from '@/components/admin/form-orcamento';
import { criarOrcamento } from '../actions';

export default function NovoOrcamento() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Novo orçamento</h1>
      <FormOrcamento action={criarOrcamento} />
    </div>
  );
}