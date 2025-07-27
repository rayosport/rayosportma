// Import the sections for our new Rayo Sport website
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import FaqSectionComponent from "@/components/sections/FaqSection";
import RulesSectionComponent from "@/components/sections/RulesSection";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";
import UpcomingMatchesSectionComponent from "@/components/sections/UpcomingMatchesSection";
import PastGamesSectionComponent from "@/components/sections/PastGamesSection";
import TestimonialsSectionComponent from "@/components/sections/TestimonialsSection";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";
import { useNav } from "@/hooks/use-intersection";
import { FiUsers, FiCalendar, FiActivity, FiAward, FiX } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// Hero section
const HeroSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-jetblack text-white overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-jetblack/40"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealAnimation>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("hero_title")} <span style={{color: '#ecd71b'}}>{t("hero_title_highlight")}</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-10">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col gap-4 max-w-md">
            {/* Bouton Rejoindre WhatsApp */}
            <button 
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-xl hover:from-green-600 hover:via-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'hero_section');
                onJoinClick();
              }}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </div>
                
                {/* Text */}
                <div className="text-left">
                  <div className="text-sm font-semibold">{t("hero_cta_primary")}</div>
                  <div className="text-xs opacity-90">Rejoindre la communauté</div>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-all duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            </button>

            {/* Bouton Matchs à venir */}
            <button 
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
              onClick={() => {
                trackEvent('view_matches_click', 'navigation', 'hero_section');
                // Scroll to upcoming matches section
                const upcomingMatchesSection = document.getElementById('upcoming-matches');
                if (upcomingMatchesSection) {
                  upcomingMatchesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                
                {/* Text */}
                <div className="text-left">
                  <div className="text-sm font-semibold">{t("hero_cta_secondary")}</div>
                  <div className="text-xs opacity-90">Prochains matchs</div>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-all duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            </button>
            
            {/* Bouton Matchs passés */}
            <button 
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
              onClick={() => {
                trackEvent('view_past_games_click', 'navigation', 'hero_section');
                // Scroll to past games section
                const pastGamesSection = document.getElementById('past-games');
                if (pastGamesSection) {
                  pastGamesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                
                {/* Text */}
                <div className="text-left">
                  <div className="text-sm font-semibold">Matchs passés</div>
                  <div className="text-xs opacity-90">Résultats & stats</div>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-all duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            </button>
          </div>
          
          <div className="mt-16 flex items-center">
            <div className="bg-rayoblue rounded-full w-14 h-14 flex items-center justify-center">
              <span className="text-xl font-bold">500+</span>
            </div>
            <p className="ml-4 text-lg opacity-80">{t("hero_players_text")}</p>
          </div>
        </RevealAnimation>
      </div>
      
      {/* Football field background effect */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#121212] to-transparent z-10"></div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="about" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-rayoblue to-gray-800 bg-clip-text text-transparent">{t("about_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("about_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <RevealAnimation delay={0.1}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-rayoblue to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_concept_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_concept_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_mission_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_mission_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_vision_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_vision_text")}
              </p>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  const steps = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: t("how_step1_title"),
      description: t("how_step1_description"),
      color: "from-blue-500 to-rayoblue"
    },
    {
      icon: <FiCalendar className="w-8 h-8" />,
      title: t("how_step2_title"),
      description: t("how_step2_description"),
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <FiActivity className="w-8 h-8" />,
      title: t("how_step3_title"),
      description: t("how_step3_description"),
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: t("how_step4_title"),
      description: t("how_step4_description"),
      color: "from-orange-500 to-red-600"
    }
  ];
  
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-rayoblue to-gray-800 bg-clip-text text-transparent">{t("how_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("how_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <RevealAnimation key={index} delay={index * 0.1}>
              <div className="relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <div className={`w-full h-full bg-gradient-to-br ${step.color} rounded-full transform translate-x-8 -translate-y-8`}></div>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="w-8 h-1 bg-gradient-to-r from-transparent via-rayoblue to-transparent mb-4"></div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <RevealAnimation>
            <button 
              className="relative overflow-hidden bg-gradient-to-r from-rayoblue to-blue-600 text-white px-10 py-4 text-lg rounded-2xl hover:from-rayoblue/90 hover:to-blue-600/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'how_it_works_section');
                onJoinClick();
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("how_cta_button")}</span>
            </button>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

// Upcoming Matches Section
const UpcomingMatchesSection = () => {
  return <UpcomingMatchesSectionComponent />;
};

// Past Games Section
const PastGamesSection = () => {
  return <PastGamesSectionComponent />;
};

// Leaderboard Section
const LeaderboardSection = () => {
  return <LeaderboardSectionComponent />;
};

// Formats & Rules Section
const RulesSection = () => {
  return <RulesSectionComponent />;
};

// FAQ Section (importé depuis notre composant spécifique)
const FaqSection = () => {
  return <FaqSectionComponent />;
};

// CTA Section
const CtaSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <section id="cta" className="py-24 bg-gradient-to-br from-rayoblue via-blue-600 to-indigo-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <RevealAnimation>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("cta_title")}</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 opacity-90">
            {t("cta_subtitle")}
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <button 
              className="relative overflow-hidden bg-white text-rayoblue px-8 py-4 text-lg rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'cta_section');
                onJoinClick();
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("cta_whatsapp")}</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            <button 
              className="relative overflow-hidden border-2 border-white/30 text-white px-8 py-4 text-lg rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group backdrop-blur-sm"
              onClick={() => {
                trackEvent('instagram_click', 'social_media', 'cta_section');
                window.open('https://www.instagram.com/rayosport.ma/', '_blank');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("cta_instagram")}</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </button>
          </div>
          
          <p 
            className="mt-10 opacity-70 text-sm cursor-pointer hover:opacity-100 transition-all duration-300 hover:scale-105 inline-block"
            onClick={() => window.open('https://www.instagram.com/rayosport.ma/', '_blank')}
          >
            {t("cta_button_app")}
          </p>
        </RevealAnimation>
      </div>
    </section>
  );
};

// WhatsApp Groups Modal Component
const WhatsAppGroupsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useLanguage();
  
  const whatsappGroups = [
    {
      city: "Rayo Casablanca",
      link: "https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA",
      color: "from-blue-500 to-rayoblue"
    },
    {
      city: "Rayo Berrechid", 
      link: "https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN",
      color: "from-green-500 to-emerald-600"
    },
    {
      city: "Rayo Bouskoura",
      link: "https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo",
      color: "from-purple-500 to-indigo-600"
    },
    {
      city: "Rayo Marrakech",
      link: "https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf",
      color: "from-orange-500 to-red-600"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl font-bold bg-gradient-to-r from-rayoblue to-blue-600 bg-clip-text text-transparent mb-2">
            Rejoindre un groupe WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          <p className="text-center text-gray-600 mb-8">
            Choisissez votre ville pour rejoindre le groupe WhatsApp
          </p>
          {whatsappGroups.map((group, index) => (
            <div key={index} className="relative bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-green-400/30 group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 opacity-10">
                <div className={`w-full h-full bg-gradient-to-br ${group.color} rounded-full transform translate-x-4 md:translate-x-8 -translate-y-4 md:-translate-y-8`}></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-gray-900 text-base md:text-lg block truncate">{group.city}</span>
                    <div className="w-10 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-1"></div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (group.link !== "#") {
                      trackEvent('whatsapp_join', 'user_engagement', group.city);
                      window.open(group.link, '_blank');
                    }
                  }}
                  disabled={group.link === "#"}
                  className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto ${
                    group.link === "#" 
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl"
                  }`}
                >
                  {group.link === "#" ? "Bientôt" : "Rejoindre"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Home = () => {
  // Initialize navigation tracking
  useNav();
  
  // State for WhatsApp modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Listen for WhatsApp modal events from header
  useEffect(() => {
    const handleOpenModal = () => {
      setIsWhatsAppModalOpen(true);
    };

    window.addEventListener('openWhatsAppModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openWhatsAppModal', handleOpenModal);
    };
  }, []);

  const handleJoinClick = () => {
    setIsWhatsAppModalOpen(true);
  };

  return (
    <main className="overflow-hidden">
      <HeroSection onJoinClick={handleJoinClick} />
      <UpcomingMatchesSection />
      <PastGamesSection />
      <LeaderboardSection />
      <TestimonialsSectionComponent />
      <AboutSection />
      <HowItWorksSection onJoinClick={handleJoinClick} />
      <RulesSection />
      <FaqSection />
      <CtaSection onJoinClick={handleJoinClick} />
      <Footer />
      
      {/* WhatsApp Groups Modal */}
      <WhatsAppGroupsModal 
        isOpen={isWhatsAppModalOpen} 
        onClose={() => setIsWhatsAppModalOpen(false)} 
      />
      
      {/* WhatsApp Contact Bubble */}
      <WhatsAppBubble />
    </main>
  );
};

export default Home;
