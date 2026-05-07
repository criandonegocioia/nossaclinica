'use client';

import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { LightboxProps } from './types';

export default function PhotoLightbox({ photos, currentIndex, onClose, onNavigate }: LightboxProps) {
  const photo = photos[currentIndex];
  const total = photos.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;

  const goPrev = useCallback(() => { if (hasPrev) onNavigate(currentIndex - 1); }, [hasPrev, currentIndex, onNavigate]);
  const goNext = useCallback(() => { if (hasNext) onNavigate(currentIndex + 1); }, [hasNext, currentIndex, onNavigate]);

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose} aria-label="Visualizador de fotos" role="dialog">
      {/* Close button */}
      <button className="lightbox-close" onClick={onClose} aria-label="Fechar">
        <X size={20} />
      </button>

      {/* Counter pill */}
      <div className="lightbox-counter">
        {currentIndex + 1} / {total}
      </div>

      {/* Previous button */}
      {hasPrev && (
        <button className="lightbox-nav lightbox-nav-prev" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Foto anterior">
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div className="lightbox-image-wrap" onClick={(e) => e.stopPropagation()}>
        <img
          key={photo.id}
          src={photo.src}
          alt={photo.description || 'Foto do paciente'}
          className="lightbox-image"
          draggable={false}
        />
      </div>

      {/* Next button */}
      {hasNext && (
        <button className="lightbox-nav lightbox-nav-next" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Próxima foto">
          <ChevronRight size={24} />
        </button>
      )}

      {/* Bottom info bar */}
      {(photo.description || photo.date) && (
        <div className="lightbox-info">
          {photo.description && <span className="lightbox-info-desc">{photo.description}</span>}
          {photo.date && <span className="lightbox-info-date">{photo.date}</span>}
        </div>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="lightbox-thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id}
              className={`lightbox-thumb ${i === currentIndex ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              aria-label={`Foto ${i + 1}`}
            >
              <img src={p.src} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
