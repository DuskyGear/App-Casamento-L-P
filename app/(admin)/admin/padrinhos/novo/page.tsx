import FormPadrinho from '@/components/admin/form-padrinho';
import { criarPadrinho } from '../actions';

export default function NovoPadrinho() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Novo padrinho ou madrinha</h1>
      <FormPadrinho action={criarPadrinho} />
    </div>
  );
}