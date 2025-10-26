import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useNav } from "@/hooks/use-intersection";
import CompanyLayout from "@/components/layout/CompanyLayout";
import CompanyHeroSection from "@/components/sections/CompanyHeroSection";
import UpcomingMatchesSectionComponent from "@/components/sections/UpcomingMatchesSection";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";
import PastGamesSectionComponent from "@/components/sections/PastGamesSection";
import RulesSectionComponent from "@/components/sections/RulesSection";
import FaqSectionComponent from "@/components/sections/FaqSection";
import RevealAnimation from "@/components/ui/RevealAnimation";
import NextMatchCountdown from "@/components/ui/NextMatchCountdown";
import { getCompany } from "@/config/companies";

// Section À propos spécifique à l'entreprise
const CompanyAboutSection = ({ companyCode }: { companyCode: string }) => {
  const company = getCompany(companyCode);
  const { t } = useLanguage();
  
  if (!company) return null;

  return (
    <section id="about" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-600 to-gray-800 bg-clip-text text-transparent">
              Rayo Entreprise • {company.shortName}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Découvrez notre programme corporate en action ! Tous nos employés participent aux mêmes matchs que la communauté Rayo générale, créant des liens uniques entre le monde professionnel et sportif.
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <RevealAnimation delay={0.1}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-blue-500/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Innovation & Sport</h3>
              <p className="text-gray-600 leading-relaxed">
                Nos équipes {company.shortName} participent activement dans la communauté Rayo générale, apportant l'esprit d'innovation sur le terrain.
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-green-500/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🤝</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Intégration Communautaire</h3>
              <p className="text-gray-600 leading-relaxed">
                Nos employés ne jouent pas entre eux, mais s'intègrent dans la grande communauté Rayo, créant des réseaux uniques ville-entreprise.
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-orange-500/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">⚽</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Mêmes Matchs, Même Passion</h3>
              <p className="text-gray-600 leading-relaxed">
                Pas de ségrégation ! Nos employés participent aux tournois généraux de Casablanca, représentant fièrement {company.shortName}.
              </p>
            </div>
          </RevealAnimation>
        </div>

        {/* Intégration employés dans la communauté */}
        <div className="mt-16">
          <RevealAnimation>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Comment nos employés s'intègrent</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">👥</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Inscription Générale</h4>
                    <p className="text-sm text-gray-600">Nos employés rejoignent les groupes WhatsApp Rayo Casablanca</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">⚽</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Matchs Mixtes</h4>
                    <p className="text-sm text-gray-600">Jouent avec tous les Rayistes, pas seulement entre collègues</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">🏆</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Représentation Entreprise</h4>
                    <p className="text-sm text-gray-600">Portent fièrement les couleurs de {company.shortName} en communauté</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">🤝</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Réseau Professionnel</h4>
                    <p className="text-sm text-gray-600">Créent des liens avec d'autres entrepreneurs et professionnels</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

// Section CTA spécifique entreprise
const CompanyCTASection = ({ companyCode }: { companyCode: string }) => {
  const company = getCompany(companyCode);
  
  if (!company) return null;

  return (
    <section id="cta" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <RevealAnimation>
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-3xl">🏢</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Modèle {company.shortName}
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 opacity-90">
            Inspirez-vous de notre approche : nos employés participent aux matchs généraux Rayo Casablanca, créant un pont unique entre innovation et sport
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <button 
              className="relative overflow-hidden bg-white text-blue-700 px-8 py-4 text-lg rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group"
              onClick={() => {
                window.open(company.contact.whatsapp, '_blank');
              }}
            >
              <span className="relative z-10">Voir les matchs en cours</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            
            <button 
              className="relative overflow-hidden border-2 border-white/30 text-white px-8 py-4 text-lg rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group backdrop-blur-sm"
              onClick={() => {
                window.open(`mailto:${company.contact.email}`, '_blank');
              }}
            >
              <span className="relative z-10">Créer votre programme</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </button>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

const NemoPage = () => {
  // Initialize navigation tracking
  useNav();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleJoinClick = () => {
    // Cette fonction sera gérée par le HeroSection
  };

  return (
    <CompanyLayout companyCode="nemo">
      <main className="overflow-hidden">
        <CompanyHeroSection 
          companyCode="nemo" 
          onJoinClick={handleJoinClick} 
        />
        <UpcomingMatchesSectionComponent />
        <NextMatchCountdown />
        <PastGamesSectionComponent />
        <LeaderboardSectionComponent />
        
      </main>
    </CompanyLayout>
  );
};

export default NemoPage;