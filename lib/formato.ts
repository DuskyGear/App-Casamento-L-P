export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "2026-11-05" → "05/11/2026" */
export const dataBR = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '—');

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília. */
export const hojeISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

/** Aceita "389,90", "50.000,00" ou "389.90". */
export function numeroBR(v: FormDataEntryValue | null): number {
  let s = String(v ?? '').replace(/[R$\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}