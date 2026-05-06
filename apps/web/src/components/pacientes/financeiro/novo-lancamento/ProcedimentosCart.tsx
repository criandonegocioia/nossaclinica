'use client';

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { INITIAL_PROCEDURE_PRICES, type ProcedurePrice } from '@/components/pacientes/shared/constants';
import type { FinanceFormData, CartItem } from './types';
import { calcItemFinal, calcItemDiscount } from './types';

const activePrices = INITIAL_PROCEDURE_PRICES.filter((p) => p.status === 'ATIVO');

export default function ProcedimentosCart() {
  const { control, setValue } = useFormContext<FinanceFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) as CartItem[];

  const isInCart = useCallback(
    (id: string) => items?.some((it) => it.procId === id) ?? false,
    [items],
  );

  const addProc = (proc: ProcedurePrice) => {
    if (isInCart(proc.id)) return;
    append({ procId: proc.id, code: proc.code, name: proc.name, basePrice: proc.price, discountType: 'NENHUM', discountValue: 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* ── Procedure Picker ──────────────────────────────── */}
      <div className="input-group">
        <label className="input-label">Selecione os procedimentos</label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)',
          maxHeight: 200, overflowY: 'auto', border: '1px solid var(--gray-200)',
          padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
        }}>
          {activePrices.map((proc) => {
            const inCart = isInCart(proc.id);
            return (
              <label key={proc.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-xs)',
                background: inCart ? 'var(--primary-50)' : 'transparent',
                color: inCart ? 'var(--primary-700)' : 'var(--gray-600)',
                transition: 'all 0.1s ease',
              }}>
                <input type="checkbox" checked={inCart}
                  onChange={() => inCart ? remove(items.findIndex((i) => i.procId === proc.id)) : addProc(proc)}
                  style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                <span style={{ flex: 1 }}>{proc.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: 11 }}>
                  R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Cart Table ────────────────────────────────────── */}
      {fields.length > 0 && (
        <div className="table-container">
          <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr>
                <th>Procedimento</th><th>Valor</th><th>Desconto</th><th>Final</th><th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const item = items?.[idx];
                if (!item) return null;
                const final_ = calcItemFinal(item);
                const disc   = calcItemDiscount(item);
                return (
                  <tr key={field.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>R$ {item.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <select className="input" value={item.discountType}
                          onChange={(e) => { setValue(`items.${idx}.discountType`, e.target.value as CartItem['discountType']); if (e.target.value === 'NENHUM') setValue(`items.${idx}.discountValue`, 0); }}
                          style={{ width: 80, height: 28, fontSize: 11, padding: '0 4px' }}>
                          <option value="NENHUM">—</option>
                          <option value="PERCENTUAL">%</option>
                          <option value="FIXO">R$</option>
                        </select>
                        {item.discountType !== 'NENHUM' && (
                          <input className="input" type="number" min="0" step="0.01"
                            value={item.discountValue}
                            onChange={(e) => setValue(`items.${idx}.discountValue`, parseFloat(e.target.value) || 0)}
                            style={{ width: 64, height: 28, fontSize: 11, padding: '0 4px' }} />
                        )}
                        {disc > 0 && <span style={{ fontSize: 10, color: 'var(--error-500)' }}>-R$ {disc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success-700)' }}>R$ {final_.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => remove(idx)}
                        style={{ color: 'var(--error-500)' }} aria-label="Remover procedimento">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
