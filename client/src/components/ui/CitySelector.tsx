import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

interface City {
  id: string;
  name: string;
  whatsappLink: string;
}

const CITIES: Record<string, City[]> = {
  fr: [
    { id: 'casablanca', name: 'Casablanca', whatsappLink: 'https://wa.me/212522000000' },
    { id: 'berrechid', name: 'Berrechid', whatsappLink: 'https://wa.me/212522000001' },
  ],
  ar: [
    { id: 'casablanca', name: 'الدار البيضاء', whatsappLink: 'https://wa.me/212522000000' },
    { id: 'berrechid', name: 'برشيد', whatsappLink: 'https://wa.me/212522000001' },
  ],
};

export function CitySelector() {
  const { t, language } = useLanguage();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setIsOpen(false);
    // Redirection vers le lien WhatsApp de la ville sélectionnée
    window.location.href = city.whatsappLink;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          {t('join_match')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('select_city')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {CITIES[language].map((city) => (
            <Button
              key={city.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCitySelect(city)}
            >
              {city.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 