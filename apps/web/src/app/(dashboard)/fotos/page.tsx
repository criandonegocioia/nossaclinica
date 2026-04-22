'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PatientSelector } from '@/components/shared/PatientSelector';
import { usePatientPhotos, useUploadPhoto } from '@/hooks/useApi';
import { api } from '@/lib/api';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Filter,
  Grid,
  List,
  Trash2,
  Download,
  ZoomIn,
  X,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'ANTES', label: 'Antes' },
  { value: 'DURANTE', label: 'Durante' },
  { value: 'DEPOIS', label: 'Depois' },
  { value: 'EXAME', label: 'Raio-X / Exame' },
  { value: 'OUTRO', label: 'Scan 3D / Outros' },
];

interface PhotoFile {
  id: string;
  file?: File;
  preview: string;
  name: string;
  category: string;
  date: string;
  size: string;
}

export default function FotosPage() {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; }, [photos]);

  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [dragOver, setDragOver] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: dbPhotosResponse } = usePatientPhotos(selectedPatientId || '');
  const uploadPhoto = useUploadPhoto();

  useEffect(() => {
    if (!selectedPatientId) {
      setPhotos([]);
      return;
    }
    
    const dbPhotos = dbPhotosResponse?.data || [];
    let active = true;
    
    const sync = async () => {
       const mapped: PhotoFile[] = [];
       for (const p of dbPhotos) {
          const existing = photosRef.current.find(x => x.id === p.id && x.preview);
          if (existing) {
             mapped.push(existing);
             continue;
          }
          
          try {
             const res = await api.get(`/photos/${p.id}/content`, { responseType: 'blob' });
             const url = URL.createObjectURL(res.data);
             mapped.push({
               id: p.id, preview: url, name: p.fileName, category: p.category || 'ANTES',
               date: new Date(p.createdAt).toLocaleDateString('pt-BR'),
               size: p.fileSize ? `${(p.fileSize / 1024 / 1024).toFixed(1)} MB` : '-',
             });
          } catch (e) {
             mapped.push({
               id: p.id, preview: '', name: p.fileName, category: p.category || 'ANTES',
               date: new Date(p.createdAt).toLocaleDateString('pt-BR'),
               size: p.fileSize ? `${(p.fileSize / 1024 / 1024).toFixed(1)} MB` : '-',
             });
          }
       }
       if (active) {
          setPhotos(prev => {
             const temps = prev.filter(x => x.id.startsWith('temp-'));
             return [...mapped, ...temps];
          });
       }
    };
    
    sync();
    return () => { active = false; };
  }, [dbPhotosResponse, selectedPatientId]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!selectedPatientId) return;
    const defaultCat = category === 'all' ? 'ANTES' : category;
    const newPhotos: PhotoFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        preview: URL.createObjectURL(f),
        name: f.name,
        category: defaultCat,
        date: new Date().toLocaleDateString('pt-BR'),
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      }));
    
    setPhotos((prev) => [...prev, ...newPhotos]);
    
    for (const p of newPhotos) {
       if (!p.file) continue;
       const fd = new FormData();
       fd.append('file', p.file);
       fd.append('patientId', selectedPatientId);
       fd.append('category', p.category);
       try {
           await uploadPhoto.mutateAsync(fd);
           setPhotos(prev => prev.filter(x => x.id !== p.id));
       } catch (e) {
           console.error(e);
       }
    }
  }, [category, selectedPatientId, uploadPhoto]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCategory = (id: string, cat: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, category: cat } : p)));
  };

  const filtered = category === 'all' ? photos : photos.filter((p) => p.category === category);
  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      const idx = filtered.findIndex(p => p.id === selectedPhoto.id);
      if (e.key === 'ArrowLeft' && idx > 0) setSelectedPhoto(filtered[idx - 1]);
      if (e.key === 'ArrowRight' && idx < filtered.length - 1) setSelectedPhoto(filtered[idx + 1]);
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, filtered]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Camera size={28} style={{ color: 'var(--primary-500)' }} />
              Fotos Clínicas
            </span>
          </h1>
          <p className="page-subtitle">{photos.length} fotos no acervo</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <button
              className={`btn btn-sm btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ borderRadius: 0 }}
            >
              <Grid size={16} />
            </button>
            <button
              className={`btn btn-sm btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: 0 }}
            >
              <List size={16} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Patient Selector */}
      <PatientSelector
        label="Fotos de"
        selectedPatientId={selectedPatientId ?? undefined}
        onSelect={(p) => setSelectedPatientId(p.id || null)}
      />

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--gray-400)', marginTop: 6 }} />
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`btn btn-sm ${category === c.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setCategory(c.value); setPage(1); }}
          >
            {c.label}
            {c.value !== 'all' && (
              <span style={{
                fontSize: '10px', marginLeft: 4,
                background: category === c.value ? 'rgba(255,255,255,0.2)' : 'var(--gray-100)',
                padding: '0 6px', borderRadius: 'var(--radius-full)',
              }}>
                {photos.filter((p) => p.category === c.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary-400)' : 'var(--gray-200)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10)',
          textAlign: 'center',
          marginBottom: 'var(--space-6)',
          background: dragOver ? 'var(--primary-50)' : 'var(--gray-25)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={36} style={{ color: dragOver ? 'var(--primary-500)' : 'var(--gray-300)', margin: '0 auto var(--space-3)' }} />
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', color: 'var(--gray-600)' }}>
          {dragOver ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para upload'}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 'var(--space-1)' }}>
          JPG, PNG, HEIC · Máx. 25MB por arquivo
        </p>
      </div>

      {/* Photos Grid/List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--gray-400)' }}>
          <FolderOpen size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
          <p style={{ fontSize: 'var(--text-base)' }}>
            {photos.length === 0 ? 'Nenhuma foto adicionada' : 'Nenhuma foto nesta categoria'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {paginated.map((photo, i) => (
            <div
              key={photo.id}
              className="card"
              style={{
                overflow: 'hidden', cursor: 'pointer',
                animation: `fadeInUp 0.3s ease backwards ${i * 40}ms`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div
                style={{
                  height: 180, background: `url(${photo.preview}) center/cover`,
                  position: 'relative',
                }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div style={{
                  position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
                  display: 'flex', gap: 'var(--space-1)',
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                  padding: 'var(--space-6) var(--space-3) var(--space-2)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                }}>
                  <span style={{ color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                    {photo.date}
                  </span>
                  <ZoomIn size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)' }}>
                <select
                  className="input"
                  value={photo.category}
                  onChange={(e) => updateCategory(photo.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)', height: 30 }}
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Tamanho</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((photo) => (
                <tr key={photo.id}>
                  <td>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `url(${photo.preview}) center/cover` }} />
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{photo.name}</td>
                  <td>
                    <select className="input" value={photo.category} onChange={(e) => updateCategory(photo.id, e.target.value)} style={{ fontSize: 'var(--text-xs)', height: 30, width: 120 }}>
                      {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{photo.date}</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{photo.size}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removePhoto(photo.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', alignSelf: 'center' }}>
            Página {page} de {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima →</button>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Header */}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-4) var(--space-6)',
            background: 'linear-gradient(rgba(0,0,0,0.8), transparent)'
          }}>
            <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                {CATEGORIES.find(c => c.value === selectedPhoto.category)?.label || selectedPhoto.category}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-300)' }}>
                {selectedPhoto.date} • {selectedPhoto.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation and Image Wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 var(--space-6)' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const idx = filtered.findIndex(p => p.id === selectedPhoto.id);
                if (idx > 0) setSelectedPhoto(filtered[idx - 1]);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: filtered.findIndex(p => p.id === selectedPhoto.id) > 0 ? 'pointer' : 'not-allowed', 
                color: 'white', opacity: filtered.findIndex(p => p.id === selectedPhoto.id) > 0 ? 1 : 0.3,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => { if (filtered.findIndex(p => p.id === selectedPhoto.id) > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ChevronLeft size={28} />
            </button>

            <img
              src={selectedPhoto.preview}
              alt={selectedPhoto.name}
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 'var(--radius-lg)', objectFit: 'contain', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
            />

            <button 
              onClick={(e) => {
                e.stopPropagation();
                const idx = filtered.findIndex(p => p.id === selectedPhoto.id);
                if (idx < filtered.length - 1) setSelectedPhoto(filtered[idx + 1]);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: filtered.findIndex(p => p.id === selectedPhoto.id) < filtered.length - 1 ? 'pointer' : 'not-allowed', 
                color: 'white', opacity: filtered.findIndex(p => p.id === selectedPhoto.id) < filtered.length - 1 ? 1 : 0.3,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => { if (filtered.findIndex(p => p.id === selectedPhoto.id) < filtered.length - 1) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
