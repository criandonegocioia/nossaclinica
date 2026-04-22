'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh', width: '100%',
    }}>
      {/* Left - Branding */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-600) 50%, var(--teal-500) 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: 'var(--space-16)', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', top: '-10%', left: '-10%',
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', bottom: '-15%', right: '-5%',
        }} />

        <div style={{
          position: 'relative', textAlign: 'center', color: 'white',
          animation: 'fadeInUp 0.6s ease',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-2xl)',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-6)', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Sparkles size={36} color="white" />
          </div>
          <h1 style={{
            fontSize: '2.75rem', fontWeight: 'var(--font-bold)',
            letterSpacing: '-0.02em', marginBottom: 'var(--space-4)',
          }}>
            OdontoFace
          </h1>
          <p style={{
            fontSize: 'var(--text-lg)', opacity: 0.85, maxWidth: '380px',
            lineHeight: '1.7',
          }}>
            Gestão inteligente para clínicas odontológicas e de harmonização orofacial
          </p>
          <div style={{
            display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-10)',
            justifyContent: 'center',
          }}>
            {['Prontuário Digital', 'Agenda Smart', 'Fotos & Drive'].map((feat) => (
              <div key={feat} style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)', border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: 'var(--space-16)',
        background: 'var(--gray-25)',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          animation: 'fadeInUp 0.6s ease 0.15s backwards',
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)',
            color: 'var(--gray-900)', marginBottom: 'var(--space-2)',
          }}>
            Bem-vindo de volta
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)', color: 'var(--gray-400)',
            marginBottom: 'var(--space-8)',
          }}>
            Entre com suas credenciais para acessar o sistema
          </p>

          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-6)',
              background: 'var(--error-50)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--radius-lg)', color: 'var(--error-600)',
              fontSize: 'var(--text-sm)', animation: 'shake 0.4s ease',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label" htmlFor="email">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--gray-400)',
                }} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="input-label" htmlFor="password">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--gray-400)',
                }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--gray-400)',
                    padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: 'var(--space-8)',
            fontSize: 'var(--text-xs)', color: 'var(--gray-300)',
          }}>
            OdontoFace v1.0 · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
