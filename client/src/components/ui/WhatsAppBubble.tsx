import { useState, useEffect } from "react";
import { FaWhatsapp, FaTimes } from "react-icons/fa";
import { useLanguage } from "@/hooks/use-language";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppBubble = () => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show bubble after user scrolls or after a longer delay
  useEffect(() => {
    let hasScrolled = false;
    let timeoutId: NodeJS.Timeout;

    // Function to show the bubble
    const showBubble = () => {
      if (!hasScrolled) {
        hasScrolled = true;
        setIsVisible(true);
      }
    };

    // Show after scroll
    const handleScroll = () => {
      if (window.scrollY > 300) { // Show after scrolling 300px
        showBubble();
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Show after 8 seconds if user hasn't scrolled
    timeoutId = setTimeout(() => {
      showBubble();
      window.removeEventListener('scroll', handleScroll);
    }, 8000);

    // Listen for scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-expand briefly to get attention, then collapse (only after more interaction)
  useEffect(() => {
    if (isVisible) {
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
        const collapseTimer = setTimeout(() => {
          setIsExpanded(false);
        }, 4000); // Show expanded state longer
        return () => clearTimeout(collapseTimer);
      }, 2000); // Wait longer before expanding

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
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5 // Additional delay for smoother entrance
          }
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={isExpanded ? () => setIsExpanded(false) : handleWhatsAppClick}
        onMouseEnter={() => !isExpanded && setIsExpanded(true)}
        className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative group"
      >
        <FaWhatsapp className="h-8 w-8" />
        
        {/* Subtle pulse animation - only show after user has seen the button */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-green-500 opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.1, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5 // Start pulsing only after 5 seconds
          }}
        />
        
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