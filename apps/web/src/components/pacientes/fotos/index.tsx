'use client';

import { useState } from 'react';
import { Camera, Upload, ChevronLeft } from 'lucide-react';
import { usePatientPhotos, useUploadPhoto } from '@/hooks/useApi';
import { InlineFormHeader, Field, EmptyState } from '../shared/ui';
import { PHOTO_CATEGORIES } from '../shared/types';
import { getApiBaseUrl } from '@/lib/api';
import type { TabComponentProps, Photo, PhotoCategory } from '../shared/types';

// ── Upload Form ────────────────────────────────────────────────────────────────
function UploadForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<PhotoCategory>('ANTES');
  const [desc, setDesc] = useState('');
  const [dragging, setDragging] = useState(false);
  const upload = useUploadPhoto();

  const addFiles = (fl: FileList | File[]) =>
    setFiles((p) => [...p, ...Array.from(fl).filter((f) => f.type.startsWith('image/'))]);

  const handleUpload = async () => {
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patientId);
      fd.append('category', category);
      fd.append('description', desc);
      await upload.mutateAsync(fd);
    }
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Upload de Fotos" onBack={onDone} />
        <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
          <Field label="Categoria">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as PhotoCategory)}>
              {Object.entries(PHOTO_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Foto frontal antes do tratamento" />
          </Field>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
          onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = (ev) => { const t = ev.target as HTMLInputElement; if (t.files) addFiles(t.files); }; i.click(); }}
          style={{ border: `2px dashed ${dragging ? 'var(--primary-400)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-xl)', padding: 'var(--space-10)', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--primary-25, #f0fdfa)' : 'var(--gray-25)', transition: 'all 0.2s ease' }}
        >
          <Upload size={36} style={{ margin: '0 auto var(--space-3)', color: dragging ? 'var(--primary-500)' : 'var(--gray-300)' }} />
          <p style={{ fontWeight: 'var(--font-medium)', color: dragging ? 'var(--primary-600)' : 'var(--gray-600)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
            {dragging ? 'Solte as imagens aqui' : 'Arraste e solte imagens aqui'}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>ou <span style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>clique para selecionar</span> · JPG, PNG, WEBP</p>
        </div>
        {files.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
                <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={(e) => { e.stopPropagation(); setFiles((p) => p.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={upload.isPending || files.length === 0}>
            {upload.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Enviando...</> : <><Upload size={14} /> Enviar {files.length > 0 ? `${files.length} Foto(s)` : 'Fotos'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────
function Gallery({ photos, onUpload }: { photos: Photo[]; onUpload: () => void }) {
  const grouped = photos.reduce((acc: Record<string, Photo[]>, p) => {
    const cat = p.category || 'OUTRO';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Photo[]>);
  
  const allCategories = Object.keys(PHOTO_CATEGORIES) as PhotoCategory[];
  const [activeCat, setActiveCat] = useState<PhotoCategory | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      {!activeCat ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {allCategories.map((cat, i) => {
            const { label, color } = PHOTO_CATEGORIES[cat];
            const count = grouped[cat]?.length || 0;
            const previewPhoto = grouped[cat]?.[0];
            const previewSrc = previewPhoto ? (previewPhoto.url || `${getApiBaseUrl()}/api/photos/${previewPhoto.id}/content`) : null;
            
            return (
              <div 
                key={cat} 
                onClick={() => setActiveCat(cat)}
                style={{ 
                  borderRadius: 'var(--radius-xl)', 
                  border: '1px solid var(--gray-200)', 
                  overflow: 'hidden', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  background: 'white',
                  animation: `fadeInUp 0.3s ease backwards ${i * 40}ms`
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-200)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <div style={{ height: 120, background: previewSrc ? `url(${previewSrc}) center/cover` : 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {!previewSrc && <Camera size={32} style={{ color: 'var(--gray-300)' }} />}
                  {previewSrc && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />}
                </div>
                <div style={{ padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--gray-800)' }}>{label}</h4>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: count > 0 ? color : 'var(--gray-400)', background: count > 0 ? `${color}15` : 'var(--gray-100)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {count} {count === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{`Galeria de fotos ${label.toLowerCase()}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setActiveCat(null)}><ChevronLeft size={18} /></button>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: PHOTO_CATEGORIES[activeCat].color }} />
              {PHOTO_CATEGORIES[activeCat].label}
            </h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
              ({grouped[activeCat]?.length || 0} {(grouped[activeCat]?.length || 0) === 1 ? 'foto' : 'fotos'})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            {(grouped[activeCat] || []).map((p, i) => {
              const src = p.url || `${getApiBaseUrl()}/api/photos/${p.id}/content`;
              return (
                <div key={p.id} onClick={() => setLightbox(src)} style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', background: 'var(--gray-100)', cursor: 'zoom-in', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'transform 0.15s ease', animation: `fadeIn 0.3s ease backwards ${i * 40}ms` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}>
                  <img src={src} alt={p.description || p.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', color: 'white' }}>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                    {p.description && <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>}
                  </div>
                </div>
              );
            })}
            <button onClick={onUpload} style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '1', border: '2px dashed var(--gray-200)', background: 'var(--gray-25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 'var(--text-xs)', transition: 'all 0.15s ease' }}>
              <Camera size={24} />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeIn 0.15s ease' }}>
          <img src={lightbox} alt="Foto ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
      )}
    </>
  );
}

// ── Tab export ─────────────────────────────────────────────────────────────────
export default function FotosTab({ patientId }: TabComponentProps) {
  const { data: raw } = usePatientPhotos(patientId);
  const photos: Photo[] = (raw as any)?.data ?? raw ?? [];
  const [showUpload, setShowUpload] = useState(false);

  if (showUpload) return <UploadForm patientId={patientId} onDone={() => setShowUpload(false)} />;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Galeria de Fotos</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}><Camera size={14} /> Adicionar Fotos</button>
      </div>
      {photos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Gallery photos={photos} onUpload={() => setShowUpload(true)} />
        </div>
      ) : (
        <Gallery photos={photos} onUpload={() => setShowUpload(true)} />
      )}
    </div>
  );
}
