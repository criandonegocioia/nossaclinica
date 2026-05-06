'use client';

import { useState } from 'react';
import { Printer, MessageCircle, Copy, CheckCircle, X, Mail } from 'lucide-react';
import { gerarTextoReciboAmigavel, abrirWhatsApp, copiarRecibo } from '@/shared/utils/gerarTextoRecibo';
import type { DadosRecibo } from '@/shared/utils/gerarTextoRecibo';

interface ReciboModalProps {
  dados: DadosRecibo;
  total: number;
  onClose: () => void;
}

export function ReciboModal({ dados, total, onClose }: ReciboModalProps) {
  const [copied, setCopied] = useState(false);
  const texto = gerarTextoReciboAmigavel(dados);
  const BRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const handleCopy = async () => {
    await copiarRecibo(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-label="Recibo do lançamento"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-emerald-900">Lançamento Salvo!</h2>
              <p className="text-xs text-emerald-600">{BRL(total)} registrado com sucesso</p>
            </div>
          </div>
          <button
            aria-label="Fechar modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview do recibo */}
        <div className="px-6 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Prévia do Recibo
          </p>
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans border border-gray-100">
            {texto}
          </pre>
        </div>

        {/* Ações */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Compartilhar
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => abrirWhatsApp(texto)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b356] text-white text-sm font-medium transition-colors"
              aria-label="Compartilhar via WhatsApp"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent('Recibo de Atendimento');
                const body = encodeURIComponent(texto);
                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              aria-label="Compartilhar por E-mail"
            >
              <Mail size={16} /> E-mail
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
              aria-label="Copiar texto do recibo"
            >
              {copied
                ? <><CheckCircle size={14} className="text-emerald-500" /> Copiado!</>
                : <><Copy size={14} /> Copiar Texto</>}
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
              aria-label="Imprimir recibo"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
          >
            ← Voltar ao Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
