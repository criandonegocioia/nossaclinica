import type { CartItem, FinanceFormData } from '@/components/pacientes/financeiro/novo-lancamento/types';
import {
  calcItemFinal,
  calcSubtotal,
  calcGlobalDiscount,
  PAYMENT_LABELS,
} from '@/components/pacientes/financeiro/novo-lancamento/types';

// ── Payload para geração de recibo ─────────────────────────────────────────────
export interface DadosRecibo {
  pacienteNome: string;
  profissionalNome?: string;
  clinicaNome?: string;
  clinicaTelefone?: string;
  form: FinanceFormData;
  dataEmissao?: Date;
}

const BRL = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const fmt = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Texto formatado para WhatsApp / E-mail ─────────────────────────────────────
export function gerarTextoReciboAmigavel(dados: DadosRecibo): string {
  const { pacienteNome, profissionalNome, clinicaNome, clinicaTelefone, form, dataEmissao } = dados;
  const emissao = dataEmissao ?? new Date();
  const items: CartItem[] = form.items ?? [];
  const subtotal = calcSubtotal(items);
  const descGlobal = calcGlobalDiscount(subtotal, form.globalDiscountType, form.globalDiscountValue);
  const total = Math.max(0, subtotal - descGlobal);
  const payLabel = PAYMENT_LABELS[form.paymentMethod] ?? form.paymentMethod;
  const parcelas = form.installments > 1 ? form.installments : null;

  const linhas: string[] = [];

  // Saudação
  linhas.push(`Olá, *${pacienteNome}* 👋`);
  linhas.push(`Segue o resumo do seu atendimento em *${clinicaNome ?? 'nossa clínica'}*.\n`);

  // Procedimentos
  linhas.push('🦷 *Procedimentos realizados:*');
  items.forEach((it) => {
    const final = calcItemFinal(it);
    const disc = it.basePrice - final;
    const linha = disc > 0
      ? `  • ${it.name}: ~~${BRL(it.basePrice)}~~ → *${BRL(final)}* (desconto ${BRL(disc)})`
      : `  • ${it.name}: *${BRL(final)}*`;
    linhas.push(linha);
  });

  // Subtotal + descontos
  if (items.length > 1) linhas.push(`\n  Subtotal: ${BRL(subtotal)}`);
  if (descGlobal > 0) {
    const descLabel = form.globalDiscountType === 'PERCENTUAL'
      ? `${form.globalDiscountValue}%`
      : BRL(form.globalDiscountValue);
    linhas.push(`  🎉 Desconto aplicado (${descLabel}): -${BRL(descGlobal)}`);
  }

  // Total
  linhas.push(`\n💰 *Valor total: ${BRL(total)}*`);

  // Pagamento
  const statusEmoji = form.status === 'PAGO' ? '✅ *Pago*' : '⏳ *Pendente*';
  linhas.push(`   Status: ${statusEmoji}`);
  linhas.push(`   Forma: ${payLabel}${parcelas ? ` em *${parcelas}x*` : ''}`);
  if (form.dueDate) {
    const [ano, mes, dia] = form.dueDate.split('-');
    linhas.push(`   Vencimento: *${dia}/${mes}/${ano}*`);
  }

  // Observações
  if (form.notes) linhas.push(`\n📋 Obs: ${form.notes}`);

  // Rodapé
  linhas.push(`\n───────────────────────`);
  linhas.push(`Emitido em ${fmt(emissao)}`);
  if (profissionalNome) linhas.push(`Responsável: ${profissionalNome}`);
  if (clinicaTelefone) linhas.push(`Contato: ${clinicaTelefone}`);
  linhas.push(`_Este é um comprovante informal. Solicite o recibo oficial, se necessário._`);

  return linhas.join('\n');
}

// ── Ação de compartilhamento ───────────────────────────────────────────────────
export function abrirWhatsApp(texto: string, telefone?: string): void {
  const encoded = encodeURIComponent(texto);
  const base = telefone
    ? `https://wa.me/${telefone.replace(/\D/g, '')}`
    : 'https://wa.me';
  window.open(`${base}?text=${encoded}`, '_blank');
}

export function copiarRecibo(texto: string): Promise<void> {
  return navigator.clipboard.writeText(texto);
}
