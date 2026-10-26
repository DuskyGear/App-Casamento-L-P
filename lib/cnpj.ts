/** Utilitários de CNPJ (numérico e o novo formato alfanumérico). Pode ser usado no servidor e no navegador. */

export const limparCnpj = (v: string) => v.toUpperCase().replace(/[^0-9A-Z]/g, '');

/** Aplica a máscara XX.XXX.XXX/XXXX-XX enquanto a pessoa digita. */
export function formatarCnpj(v: string) {
  const c = limparCnpj(v).slice(0, 14);
  return c.replace(/^(.{2})(.{0,3})(.{0,3})(.{0,4})(.{0,2}).*/, (_, a, b, c2, d, e) =>
    [a, b && '.' + b, c2 && '.' + c2, d && '/' + d, e && '-' + e].filter(Boolean).join(''),
  );
}

function digito(base: string, pesos: number[]) {
  const soma = base.split('').reduce((s, ch, i) => s + (ch.charCodeAt(0) - 48) * pesos[i], 0);
  const r = soma % 11;
  return r < 2 ? 0 : 11 - r;
}

/** Confere formato e dígitos verificadores. */
export function validarCnpj(valor: string) {
  const c = limparCnpj(valor);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;
  const d1 = digito(c.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito(c.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return c[12] === String(d1) && c[13] === String(d2);
}