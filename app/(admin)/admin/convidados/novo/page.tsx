import FormConvidado from '@/components/admin/form-convidado';
import { criarConvidado } from '../actions';

export default function NovoConvidado() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Novo convidado</h1>
      <FormConvidado action={criarConvidado} />
    </div>
  );
}