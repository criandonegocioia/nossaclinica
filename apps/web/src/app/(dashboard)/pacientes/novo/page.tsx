'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { useCreatePatient } from '@/hooks/useApi';

const FIELDS = {
  pessoal: [
    { name: 'name', label: 'Nome Completo', type: 'text', required: true, colSpan: 2 },
    { name: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
    { name: 'rg', label: 'RG', type: 'text' },
    { name: 'birthDate', label: 'Data de Nascimento', type: 'date' },
    {
      name: 'gender', label: 'Sexo', type: 'select',
      options: [
        { label: 'Não informado', value: 'NAO_INFORMADO' },
        { label: 'Feminino',      value: 'FEMININO' },
        { label: 'Masculino',     value: 'MASCULINO' },
        { label: 'Outro',         value: 'OUTRO' },
      ],
    },
    {
      name: 'maritalStatus', label: 'Estado Civil', type: 'select',
      options: [
        { label: 'Não informado',  value: 'NAO_INFORMADO' },
        { label: 'Solteiro(a)',     value: 'SOLTEIRO' },
        { label: 'Casado(a)',       value: 'CASADO' },
        { label: 'Divorciado(a)',   value: 'DIVORCIADO' },
        { label: 'Viúvo(a)',        value: 'VIUVO' },
        { label: 'União Estável',   value: 'UNIAO_ESTAVEL' },
      ],
    },
    { name: 'profession', label: 'Profissão', type: 'text' },
  ],
  contato: [
    { name: 'phoneMain', label: 'Telefone Principal', type: 'tel', required: true, placeholder: '(00) 00000-0000' },
    { name: 'phoneSecondary', label: 'Telefone Secundário', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'whatsapp', label: 'WhatsApp', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'email', label: 'E-mail', type: 'email', placeholder: 'email@exemplo.com' },
  ],
  endereco: [
    { name: 'zipCode', label: 'CEP', type: 'text', placeholder: '00000-000' },
    { name: 'address', label: 'Endereço', type: 'text', colSpan: 2 },
    { name: 'city', label: 'Cidade', type: 'text' },
    { name: 'state', label: 'Estado', type: 'select', options: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] },
  ],
  complementar: [
    { name: 'origin', label: 'Origem / Como conheceu', type: 'select', options: [
      { label: 'Selecione...', value: '' },
      { label: 'Indicação', value: 'Indicação' },
      { label: 'Google', value: 'Google' },
      { label: 'Instagram', value: 'Instagram' },
      { label: 'Facebook', value: 'Facebook' },
      { label: 'Site', value: 'Site' },
      { label: 'Outro', value: 'Outro' },
    ] },
    { name: 'healthInsurance', label: 'Convênio', type: 'text', placeholder: 'Particular' },
    { name: 'guardianName', label: 'Responsável (se menor)', type: 'text' },
    { name: 'guardianPhone', label: 'Telefone Responsável', type: 'tel' },
    { name: 'observations', label: 'Observações', type: 'textarea', colSpan: 2 },
  ],
};

type FieldOption = { label: string; value: string };
type FieldDef = { name: string; label: string; type: string; required?: boolean; placeholder?: string; colSpan?: number; options?: string[] | FieldOption[] };

export default function NovoPacientePage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const router = useRouter();
  const createPatient = useCreatePatient();

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setValidationError('Nome completo é obrigatório.');

    const payload = {
      ...formData,
      // Convert birthDate string to ISO DateTime for Prisma
      birthDate: formData.birthDate
        ? new Date(formData.birthDate + 'T12:00:00').toISOString()
        : undefined,
      // Ensure enum defaults if not selected
      gender: formData.gender || 'NAO_INFORMADO',
      maritalStatus: formData.maritalStatus || 'NAO_INFORMADO',
      status: 'ATIVO',
    };

    try {
      const result = await createPatient.mutateAsync(payload);
      setSuccess(true);
      setTimeout(() => router.push(`/pacientes/${result.id}`), 1500);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
      const msg = Array.isArray(errData?.message) ? errData.message[0] : errData?.message;
      setValidationError(msg ?? 'Erro ao cadastrar paciente. Verifique os dados e tente novamente.');
    }
  };

  const renderField = (field: FieldDef) => (
    <div
      key={field.name}
      className="input-group"
      style={{ gridColumn: field.colSpan === 2 ? 'span 2' : undefined }}
    >
      <label className={`input-label ${field.required ? 'required' : ''}`} htmlFor={field.name}>
        {field.label}
      </label>
      {field.type === 'select' ? (
        <select
          id={field.name}
          className="input"
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
        >
          <option value="">Selecione...</option>
          {field.options?.map((opt) => {
            const isObj = typeof opt === 'object';
            const val = isObj ? (opt as FieldOption).value : opt;
            const lbl = isObj ? (opt as FieldOption).label : opt;
            if (val === '') return null;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={field.name}
          className="input"
          rows={3}
          placeholder={field.placeholder}
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
          style={{ resize: 'vertical' }}
        />
      ) : (
        <input
          id={field.name}
          type={field.type}
          className="input"
          placeholder={field.placeholder}
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
        />
      )}
    </div>
  );

  const sections = [
    { key: 'pessoal', title: 'Dados Pessoais', fields: FIELDS.pessoal },
    { key: 'contato', title: 'Contato', fields: FIELDS.contato },
    { key: 'endereco', title: 'Endereço', fields: FIELDS.endereco },
    { key: 'complementar', title: 'Informações Complementares', fields: FIELDS.complementar },
  ];

  return (
    <>
      <Link
        href="/pacientes"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          color: 'var(--gray-400)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} /> Voltar para pacientes
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <UserPlus size={28} style={{ color: 'var(--primary-500)' }} />
              Novo Paciente
            </span>
          </h1>
          <p className="page-subtitle">Preencha os dados para cadastrar um novo paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {sections.map((section, sIdx) => (
          <div
            key={section.key}
            className="card"
            style={{ marginBottom: 'var(--space-6)', animation: `fadeInUp 0.3s ease backwards ${sIdx * 80}ms` }}
          >
            <div className="card-header">
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)' }}>
                {section.title}
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                {section.fields.map(renderField)}
              </div>
            </div>
          </div>
        ))}

        {/* Actions */}
        {success && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
            background: 'var(--success-50)', border: '1px solid var(--success-200)',
            borderRadius: 'var(--radius-lg)', color: 'var(--success-700)',
            fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            animation: 'fadeInUp 0.3s ease',
          }}>
            <CheckCircle size={18} /> Paciente cadastrado com sucesso! Redirecionando...
          </div>
        )}

        {(createPatient.isError || validationError) && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
            background: 'var(--error-50)', border: '1px solid var(--error-200)',
            borderRadius: 'var(--radius-lg)', color: 'var(--error-600)',
            fontSize: 'var(--text-sm)', animation: 'shake 0.4s ease',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {validationError || 'Erro ao cadastrar paciente. Verifique os dados e tente novamente.'}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-10)' }}>
          <Link href="/pacientes" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={createPatient.isPending || success}>
            {createPatient.isPending ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Cadastrar Paciente
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
