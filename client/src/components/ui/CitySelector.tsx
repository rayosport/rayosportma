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

interface CitySelectorProps {
  buttonText?: string;
  buttonClassName?: string;
  isWhatsappContact?: boolean;
}

export function CitySelector({ buttonText, buttonClassName = "btn-primary px-8 py-4 text-lg", isWhatsappContact = false }: CitySelectorProps) {
  const { t, language } = useLanguage();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setIsOpen(false);
    // Redirection vers le lien WhatsApp de la ville sélectionnée
    window.location.href = city.whatsappLink;
  };

  const handleWhatsappContact = () => {
    window.location.href = "https://wa.me/212649076758";
  };

  if (isWhatsappContact) {
    return (
      <button 
        className={buttonClassName}
        onClick={handleWhatsappContact}
      >
        {buttonText || t("contact_whatsapp")}
      </button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={buttonClassName}>
          {buttonText || t("hero_cta_primary")}
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