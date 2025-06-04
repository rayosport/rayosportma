// Import the sections for our new Rayo Sport website
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import FaqSectionComponent from "@/components/sections/FaqSection";
import RulesSectionComponent from "@/components/sections/RulesSection";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";
import { useNav } from "@/hooks/use-intersection";
import { FiUsers, FiCalendar, FiActivity, FiAward, FiX } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Hero section
const HeroSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-jetblack text-white">
      <div className="container mx-auto px-4">
        <RevealAnimation>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("hero_title")} <span className="text-rayoblue">{t("hero_title_highlight")}</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-10">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-wrap gap-5">
            <button 
              className="btn-primary px-8 py-4 text-lg"
              onClick={onJoinClick}
            >
              {t("hero_cta_primary")}
            </button>
            <button 
              className="btn-outline px-8 py-4 text-lg"
              onClick={() => {
                // Scroll to leaderboard section
                const leaderboardSection = document.getElementById('leaderboard');
                if (leaderboardSection) {
                  leaderboardSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {t("hero_cta_secondary")}
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
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#121212] to-transparent"></div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("about_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("about_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          <RevealAnimation delay={0.1}>
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-rayoblue">{t("about_concept_title")}</h3>
              <p className="text-gray-700">
                {t("about_concept_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-rayoblue">{t("about_mission_title")}</h3>
              <p className="text-gray-700">
                {t("about_mission_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-rayoblue">{t("about_vision_title")}</h3>
              <p className="text-gray-700">
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
      description: t("how_step1_description")
    },
    {
      icon: <FiCalendar className="w-8 h-8" />,
      title: t("how_step2_title"),
      description: t("how_step2_description")
    },
    {
      icon: <FiActivity className="w-8 h-8" />,
      title: t("how_step3_title"),
      description: t("how_step3_description")
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: t("how_step4_title"),
      description: t("how_step4_description")
    }
  ];
  
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("how_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("how_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <RevealAnimation key={index} delay={index * 0.1}>
              <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rayoblue bg-opacity-10 flex items-center justify-center text-rayoblue mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-700">
                  {step.description}
                </p>
              </div>
            </RevealAnimation>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <RevealAnimation>
            <button 
              className="btn-primary px-8 py-4 text-lg"
              onClick={onJoinClick}
            >
              {t("how_cta_button")}
            </button>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
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
    <section id="cta" className="py-24 bg-rayoblue text-white">
      <div className="container mx-auto px-4 text-center">
        <RevealAnimation>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("cta_title")}</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 opacity-90">
            {t("cta_subtitle")}
          </p>
          
          <div className="flex flex-wrap gap-5 justify-center">
            <button 
              className="btn-white px-8 py-4 text-lg flex items-center"
              onClick={onJoinClick}
            >
              <span className="mr-2">{t("cta_whatsapp")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            <button 
              className="btn-outline-white px-8 py-4 text-lg flex items-center"
              onClick={() => window.open('https://www.instagram.com/rayosport.ma/', '_blank')}
            >
              <span className="mr-2">{t("cta_instagram")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </button>
          </div>
          
          <p 
            className="mt-10 opacity-70 text-sm cursor-pointer hover:opacity-100 transition-opacity"
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
      link: "https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA"
    },
    {
      city: "Rayo Berrechid", 
      link: "https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN"
    },
    {
      city: "Rayo Bouskoura",
      link: "https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo"
    },
    {
      city: "Rayo Marrakech",
      link: "https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-rayoblue">
            Rejoindre un groupe WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <p className="text-center text-gray-600 mb-6">
            Choisissez votre ville pour rejoindre le groupe WhatsApp
          </p>
          {whatsappGroups.map((group, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900">{group.city}</span>
              </div>
              <button
                onClick={() => {
                  if (group.link !== "#") {
                    window.open(group.link, '_blank');
                  }
                }}
                disabled={group.link === "#"}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  group.link === "#" 
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {group.link === "#" ? "Bientôt" : "Rejoindre"}
              </button>
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
      <LeaderboardSection />
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
    </main>
  );
};

export default Home;
