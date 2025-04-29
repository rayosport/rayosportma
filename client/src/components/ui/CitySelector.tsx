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
        <button className="btn-primary px-8 py-4 text-lg">
          {t("hero_cta_primary")}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {t('select_city')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {CITIES[language].map((city) => (
            <Button
              key={city.id}
              variant="outline"
              className="w-full justify-start py-4 text-lg hover:bg-gray-100"
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