export interface LightboxPhoto {
  id: string;
  src: string;
  description?: string;
  date?: string;
  category?: string;
}

export interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}
