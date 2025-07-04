import { useState, useEffect } from 'react';

const STORAGE_KEY = 'rayo_sport_city_preference';

export const useCityPreference = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has previously selected a city
    const savedCity = localStorage.getItem(STORAGE_KEY);
    if (savedCity) {
      setSelectedCity(savedCity);
    } else {
      setIsFirstVisit(true);
    }
  }, []);

  const saveCityPreference = (city: string) => {
    setSelectedCity(city);
    setIsFirstVisit(false);
    localStorage.setItem(STORAGE_KEY, city);
  };

  const clearCityPreference = () => {
    setSelectedCity('');
    setIsFirstVisit(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    selectedCity,
    isFirstVisit,
    saveCityPreference,
    clearCityPreference
  };
};