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
    { id: 'casablanca', name: 'Rayo Casablanca', whatsappLink: 'https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA' },
    { id: 'berrechid', name: 'Rayo Berrechid', whatsappLink: 'https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN' },
  ],
  ar: [
    { id: 'casablanca', name: 'رايو الدار البيضاء', whatsappLink: 'https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA' },
    { id: 'berrechid', name: 'رايو برشيد', whatsappLink: 'https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN' },
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
            {language === 'fr' ? 'Sélectionnez votre ville' : 'اختر مدينتك'}
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