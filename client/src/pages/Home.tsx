// Import the sections for our new Rayo Sport website
import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import FaqSectionComponent from "@/components/sections/FaqSection";
import RulesSectionComponent from "@/components/sections/RulesSection";
import { useNav } from "@/hooks/use-intersection";
import { FiUsers, FiCalendar, FiActivity, FiAward } from "react-icons/fi";
import { CitySelector } from "@/components/ui/CitySelector";

// Hero section
const HeroSection = () => {
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
            <CitySelector />
            <button className="btn-outline px-8 py-4 text-lg">{t("hero_cta_secondary")}</button>
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
const HowItWorksSection = () => {
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
            <button className="btn-primary px-8 py-4 text-lg">{t("how_cta_button")}</button>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
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
const CtaSection = () => {
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
            <button className="btn-white px-8 py-4 text-lg flex items-center">
              <span className="mr-2">{t("cta_whatsapp")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            <button className="btn-outline-white px-8 py-4 text-lg flex items-center">
              <span className="mr-2">{t("cta_instagram")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </button>
          </div>
          
          <p className="mt-10 opacity-70 text-sm">
            {t("cta_button_app")}
          </p>
        </RevealAnimation>
      </div>
    </section>
  );
};

const Home = () => {
  // Initialize navigation tracking
  useNav();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="overflow-hidden">
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <RulesSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  );
};

export default Home;
