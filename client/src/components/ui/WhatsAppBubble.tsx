import { useState, useEffect } from "react";
import { FaWhatsapp, FaTimes } from "react-icons/fa";
import { useLanguage } from "@/hooks/use-language";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppBubble = () => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show bubble after a short delay when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-expand briefly to get attention, then collapse
  useEffect(() => {
    if (isVisible) {
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
        const collapseTimer = setTimeout(() => {
          setIsExpanded(false);
        }, 3000);
        return () => clearTimeout(collapseTimer);
      }, 1000);

      return () => clearTimeout(expandTimer);
    }
  }, [isVisible]);

  const handleWhatsAppClick = () => {
    // Open WhatsApp with a predefined message
    const message = encodeURIComponent(
      t("whatsapp_bubble_message") || 
      "Salut ! Je suis intéressé par Rayo Sport. Pouvez-vous me donner plus d'informations ?"
    );
    const phoneNumber = "+212649076758"; // Rayo Sport WhatsApp number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-4 mr-2"
          >
            {/* Message Bubble */}
            <div className="relative bg-white rounded-2xl shadow-lg p-4 max-w-xs">
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <FaTimes className="h-3 w-3" />
              </button>

              {/* Bubble tail */}
              <div className="absolute bottom-2 right-0 w-0 h-0 border-l-8 border-l-white border-t-8 border-t-transparent border-b-8 border-b-transparent transform translate-x-full"></div>

              {/* Message content */}
              <div className="text-sm text-gray-800">
                <p className="font-semibold text-green-600 mb-2">
                  {t("whatsapp_bubble_title") || "🏆 Rayo Sport"}
                </p>
                <p className="mb-3">
                  {t("whatsapp_bubble_text") || "Prêt à rejoindre la communauté ? Contactez-nous sur WhatsApp !"}
                </p>
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  <span>{t("whatsapp_bubble_button") || "Contacter"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={isExpanded ? () => setIsExpanded(false) : handleWhatsAppClick}
        onMouseEnter={() => !isExpanded && setIsExpanded(true)}
        className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative group"
      >
        <FaWhatsapp className="h-8 w-8" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25"></div>
        
        {/* Tooltip on hover (when not expanded) */}
        {!isExpanded && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {t("whatsapp_bubble_tooltip") || "Contactez-nous"}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
          </div>
        )}
      </motion.button>

      {/* Notification dot for new messages (optional) */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-xs text-white font-bold">!</span>
      </div>
    </div>
  );
};

export default WhatsAppBubble; 