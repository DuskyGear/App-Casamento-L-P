import FormPresente from '@/components/admin/form-presente';
import { criarPresente } from '../actions';

export default function NovoPresente() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Novo presente</h1>
      <FormPresente action={criarPresente} />
    </div>
  );
}