import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaChevronLeft, FaChevronRight, FaUser } from "react-icons/fa";
import { BsCheck2All } from "react-icons/bs";

const TestimonialsSection = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: t("testimonial_1_quote"),
      name: t("testimonial_1_name"),
      role: t("testimonial_1_role"),
      avatar: "", // Generic avatar will be rendered
      gameType: "Rayo Rush",
      time: "14:23",
      isOnline: true
    },
    {
      quote: t("testimonial_2_quote"),
      name: t("testimonial_2_name"),
      role: t("testimonial_2_role"),
      avatar: "", // Generic avatar will be rendered
      gameType: "Rayo Classic 7vs7",
      time: "16:45",
      isOnline: true
    },
    {
      quote: t("testimonial_3_quote"),
      name: t("testimonial_3_name"),
      role: t("testimonial_3_role"),
      avatar: "", // Generic avatar will be rendered
      gameType: "Rayo Battle",
      time: "09:12",
      isOnline: false
    },
    {
      quote: t("testimonial_4_quote"),
      name: t("testimonial_4_name"),
      role: t("testimonial_4_role"),
      avatar: "", // Generic avatar will be rendered
      gameType: "Rayo Clash",
      time: "18:30",
      isOnline: true
    },
    {
      quote: t("testimonial_5_quote"),
      name: t("testimonial_5_name"),
      role: t("testimonial_5_role"),
      avatar: "", // Generic avatar will be rendered
      gameType: "Standard 5vs5",
      time: "20:15",
      isOnline: true
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-gray-100">
      <div className="container">
        <RevealAnimation>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <FaWhatsapp className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="section-title">{t("testimonials_title")}</h2>
            </div>
            <p className="section-subtitle max-w-3xl mx-auto">
              {t("testimonials_subtitle")}
            </p>
          </div>
        </RevealAnimation>
        
        <div className="max-w-2xl mx-auto">
          <RevealAnimation delay={0.2}>
            {/* WhatsApp Chat Container */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* WhatsApp Header */}
              <div className="bg-green-500 text-white p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                    <FaWhatsapp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Rayo Sport Community</h3>
                    <p className="text-sm text-green-100">
                      {testimonials.filter(t => t.isOnline).length} joueurs en ligne
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="min-h-[400px] p-4 relative" style={{
                backgroundColor: '#e5ddd5',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0h80L80 40H40L0 80H40v80H0v-80zM40 40h80v80H40V40zm80 0h80L160 80h-40L120 40zM160 40h80v80h-80V40zm80 0h80L280 80h-40L240 40zM240 40h80v80h-80V40zm80 0h80L360 80h-40L320 40zM320 40h80v80h-80V40zM0 160h40L0 200v-40zm0 80h40v80H0v-80zm40 0h80v80H40v-80zm80 0h80v80h-80v-80zm80 0h80v80h-80v-80zm80 0h80v80h-80v-80zm80 0h80v80h-80v-80zM0 320h40L0 360v-40zm0 80h40v40H0v-40zm40 0h80v40H40v-40zm80 0h80v40h-80v-40zm80 0h80v40h-80v-40zm80 0h80v40h-80v-40zm80 0h80v40h-80v-40z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '400px 400px'
              }}>
                {/* WhatsApp default wallpaper overlay for texture */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23128C7E' fill-opacity='0.05'%3E%3Cpath d='M0 0h100v100H0V0zm10 10h80v80H10V10zm5 5h70v70H15V15zm5 5h60v60H20V20zm5 5h50v50H25V25zm5 5h40v40H30V30zm5 5h30v30H35V35zm5 5h20v20H40V40zm5 5h10v10H45V45z'/%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '100px 100px',
                  mixBlendMode: 'multiply'
                }}></div>

                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      {/* Message Bubble */}
                      <div className="flex items-start space-x-3">
                                                 {/* Avatar */}
                         <div className="relative flex-shrink-0">
                           <div className="w-12 h-12 rounded-full bg-gray-300 ring-2 ring-white flex items-center justify-center">
                             <FaUser className="h-6 w-6 text-gray-600" />
                           </div>
                           {testimonials[currentIndex].isOnline && (
                             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                           )}
                         </div>

                        {/* Message Content */}
                        <div className="flex-1 max-w-sm">
                          {/* Sender Name */}
                          <div className="text-sm font-semibold text-green-700 mb-1">
                            {testimonials[currentIndex].name}
                          </div>
                          
                          {/* Message Bubble */}
                          <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm relative">
                            {/* Message tail */}
                            <div className="absolute -left-2 top-0 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-white border-t-8 border-t-white"></div>
                            
                            {/* Message text */}
                            <p className="text-gray-800 leading-relaxed mb-3">
                              {testimonials[currentIndex].quote}
                            </p>
                            
                            {/* Game type badge */}
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mb-2">
                              ⚽ {testimonials[currentIndex].gameType}
                            </div>
                            
                            {/* Message time and status */}
                            <div className="flex items-center justify-end text-xs text-gray-500 mt-2">
                              <span className="mr-1">{testimonials[currentIndex].time}</span>
                              <BsCheck2All className="h-4 w-4 text-blue-500" />
                            </div>
                          </div>
                          
                          {/* Role under bubble */}
                          <div className="text-xs text-gray-500 mt-1 ml-3">
                            {testimonials[currentIndex].role}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* WhatsApp Input Bar (decorative) */}
              <div className="bg-gray-100 p-3 border-t">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white rounded-full px-4 py-2 text-gray-500 text-sm">
                    Tapez votre message...
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <FaWhatsapp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </RevealAnimation>

          {/* Navigation Controls */}
          <RevealAnimation delay={0.4}>
            <div className="flex items-center justify-between mt-8">
              {/* Previous Button */}
              <button
                onClick={prevTestimonial}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-lg"
                aria-label="Message précédent"
              >
                <FaChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>
              
              {/* Dots Indicator */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex 
                        ? 'bg-green-500 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Message ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* Next Button */}
              <button
                onClick={nextTestimonial}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-lg"
                aria-label="Message suivant"
              >
                <span className="hidden sm:inline">Suivant</span>
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
