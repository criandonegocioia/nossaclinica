'use client';

import { useState } from 'react';
import { Save, Printer, Mail, MessageCircle } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { INITIAL_CAMPAIGNS } from '@/components/pacientes/shared/constants';
import { Field } from '@/components/pacientes/shared/ui';
import type { FinanceFormData, CartItem } from './types';
import { calcSubtotal, calcGlobalDiscount, calcTotal, PAYMENT_LABELS } from './types';

const activeCampaigns = INITIAL_CAMPAIGNS.filter((c) => {
  const now = new Date();
  return c.active && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
});

export default function ResumoEAcoes({ isPending, saved }: { isPending: boolean; saved: boolean }) {
  const { register, setValue, getValues } = useFormContext<FinanceFormData>();
  const items = useWatch({ name: 'items' }) as CartItem[] | undefined;
  const gType = useWatch({ name: 'globalDiscountType' }) as FinanceFormData['globalDiscountType'];
  const gVal  = useWatch({ name: 'globalDiscountValue' }) as number;
  const campId = useWatch({ name: 'campaignId' }) as string | undefined;

  const subtotal      = calcSubtotal(items ?? []);
  const globalDisc    = calcGlobalDiscount(subtotal, gType, gVal);
  const total         = Math.max(0, subtotal - globalDisc);

  const applyCampaign = (id: string) => {
    const camp = INITIAL_CAMPAIGNS.find((c) => c.id === id);
    if (!camp) { setValue('campaignId', undefined); setValue('globalDiscountType', 'NENHUM'); setValue('globalDiscountValue', 0); return; }
    setValue('campaignId', id);
    setValue('globalDiscountType', camp.discountType);
    setValue('globalDiscountValue', camp.discountValue);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* ── Totals Bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Subtotal</div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--gray-700)' }}>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', borderLeft: '1px solid var(--gray-200)', paddingLeft: 'var(--space-4)' }}>
          <Field label="Desconto global">
            <div style={{ display: 'flex', gap: 1, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <select className="input" {...register('globalDiscountType')}
                onChange={(e) => { setValue('globalDiscountType', e.target.value as FinanceFormData['globalDiscountType']); if (e.target.value === 'NENHUM') { setValue('globalDiscountValue', 0); setValue('campaignId', undefined); } }}
                style={{ width: 90, border: 'none', borderRadius: 0, height: 32, fontSize: 12 }}>
                <option value="NENHUM">Nenhum</option><option value="PERCENTUAL">%</option><option value="FIXO">R$ Fixo</option>
              </select>
              <input className="input" type="number" min="0" step="0.01" {...register('globalDiscountValue', { valueAsNumber: true })}
                disabled={gType === 'NENHUM'} style={{ width: 72, border: 'none', borderRadius: 0, height: 32, fontSize: 12 }} />
            </div>
          </Field>
          {activeCampaigns.length > 0 && (
            <Field label="Campanha">
              <select className="input" value={campId ?? ''} onChange={(e) => applyCampaign(e.target.value)}
                style={{ height: 32, fontSize: 12, minWidth: 130 }}>
                <option value="">Nenhuma</option>
                {activeCampaigns.map((c) => <option key={c.id} value={c.id}>🏷️ {c.name}</option>)}
              </select>
            </Field>
          )}
        </div>

        <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--gray-200)', minWidth: 120 }}>
          <div style={{ fontSize: 11, color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>Total a Pagar</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--primary-700)' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* ── Form Fields ─────────────────────────────────── */}
      <div className="grid grid-2">
        <Field label="Método de pagamento">
          <select className="input" {...register('paymentMethod')}>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" {...register('status')}>
            <option value="PENDENTE">Pendente</option><option value="PAGO">Pago</option>
          </select>
        </Field>
        <Field label="Parcelas">
          <input className="input" type="number" min="1" max="24" {...register('installments', { valueAsNumber: true })} />
        </Field>
        <Field label="Vencimento">
          <input className="input" type="date" {...register('dueDate')} />
        </Field>
        <Field label="Observações" span>
          <input className="input" {...register('notes')} placeholder="Opcional" />
        </Field>
      </div>

      {/* ── Actions ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
        {saved ? (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={14} /> PDF</button>
            <button type="button" className="btn btn-ghost btn-sm"><Mail size={14} /> E-mail</button>
            <button type="button" className="btn btn-ghost btn-sm"><MessageCircle size={14} /> WhatsApp</button>
          </>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={isPending || !items?.length || total <= 0}>
            {isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar Lançamento</>}
          </button>
        )}
      </div>
    </div>
  );
}
