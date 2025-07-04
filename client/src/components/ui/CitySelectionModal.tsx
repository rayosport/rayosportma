import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Sparkles, Building, Landmark, Trophy, Star } from 'lucide-react';

interface CitySelectionModalProps {
  isOpen: boolean;
  onCitySelect: (city: string) => void;
}

export const CitySelectionModal = ({ isOpen, onCitySelect }: CitySelectionModalProps) => {
  const cities = [
    { 
      name: "Casablanca", 
      icon: Building, 
      description: "Centre économique",
      color: "from-blue-500 to-cyan-500",
      emoji: "🏢"
    },
    { 
      name: "Marrakech", 
      icon: Landmark, 
      description: "Ville impériale",
      color: "from-red-500 to-orange-500",
      emoji: "🏛️"
    },
    { 
      name: "Berrechid", 
      icon: Trophy, 
      description: "Terrain de jeu",
      color: "from-green-500 to-emerald-500",
      emoji: "⚽"
    },
    { 
      name: "Bouskoura", 
      icon: Star, 
      description: "Zone moderne",
      color: "from-purple-500 to-indigo-500",
      emoji: "🌟"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop with Gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md z-40"
            onClick={() => onCitySelect("Toutes les villes")}
          />
          
          {/* Modal with Modern Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-lg w-full overflow-hidden">
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600"></div>
              <div className="absolute top-4 right-4 text-orange-500/20 dark:text-orange-400/20">
                <Sparkles size={24} />
              </div>
              
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-orange-500/5 to-red-500/5 rounded-full blur-2xl"></div>
              </div>
              
              {/* Header */}
              <div className="relative p-8 pb-4">
                <div className="flex items-center justify-center mb-4">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-white shadow-lg relative"
                  >
                    <MapPin size={28} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </motion.div>
                </div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2"
                >
                  Choisissez votre ville
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-400 text-center text-sm"
                >
                  Sélectionnez votre ville pour voir les matchs locaux
                </motion.p>
              </div>
              
              {/* Cities Grid */}
              <div className="relative px-8 pb-8">
                <div className="space-y-3">
                  {cities.map((city, index) => {
                    const IconComponent = city.icon;
                    return (
                      <motion.button
                        key={city.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCitySelect(city.name)}
                        className="group w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 transform relative overflow-hidden"
                      >
                        {/* Hover Effect Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`relative bg-gradient-to-br ${city.color} rounded-xl p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <IconComponent size={24} />
                              <div className="absolute -bottom-1 -right-1 text-lg">
                                {city.emoji}
                              </div>
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {city.name}
                              </h3>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <ChevronRight 
                              size={20} 
                              className="text-gray-400 group-hover:text-orange-500 transition-colors duration-300" 
                            />
                          </motion.div>
                        </div>
                      </motion.button>
                    );
                  })}
                  
                  {/* All Cities Option */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + cities.length * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCitySelect("Toutes les villes")}
                    className="group w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 transform text-white relative overflow-hidden"
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative bg-white/20 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                          <MapPin size={24} />
                          <div className="absolute -bottom-1 -right-1 text-lg">
                            🌍
                          </div>
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-white text-lg">
                            Toutes les villes
                          </h3>
                          <p className="text-sm text-white/80">
                            Voir tous les matchs disponibles
                          </p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ChevronRight 
                          size={20} 
                          className="text-white/80 transition-colors duration-300" 
                        />
                      </motion.div>
                    </div>
                  </motion.button>
                </div>
              </div>
              
              {/* Footer */}
              <div className="relative px-8 pb-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-xs text-gray-500 dark:text-gray-400"
                >
                  Votre préférence sera sauvegardée automatiquement
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};