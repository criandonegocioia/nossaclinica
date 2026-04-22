import type { Metadata } from 'next';
import '@/styles/globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'OdontoFace — Sistema de Gestão Clínica',
  description:
    'Plataforma de gestão para clínicas odontológicas e de harmonização orofacial. Prontuário eletrônico, agendamento, fotos clínicas e mais.',
  keywords: 'clínica odontológica, harmonização orofacial, prontuário eletrônico, agendamento, gestão clínica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
