import { useState } from "react";
import { getCompany } from "@/config/companies";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CompanyHeroSectionProps {
  companyCode: string;
  onJoinClick: () => void;
}

// WhatsApp Modal pour entreprise - Communauté unifiée
const CompanyWhatsAppModal = ({ isOpen, onClose, company }: { 
  isOpen: boolean; 
  onClose: () => void; 
  company: any;
}) => {
  const handleJoinClick = () => {
    trackEvent('whatsapp_join_company', 'user_engagement', company.shortName);
    window.open(company.contact.whatsapp, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Rejoindre {company.shortName} Rayo
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl font-bold text-white">🏢</span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Programme Corporate {company.shortName}
          </h3>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Rejoignez le programme sportif corporate de {company.name}. 
            Tous les collaborateurs et leurs familles sont les bienvenus pour participer aux activités sportives.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleJoinClick}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 font-semibold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              Rejoindre le groupe WhatsApp
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CompanyHeroSection = ({ companyCode, onJoinClick }: CompanyHeroSectionProps) => {
  const company = getCompany(companyCode);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  if (!company) return null;

  const handleJoinClick = () => {
    setIsWhatsAppModalOpen(true);
    trackEvent('company_join_click', 'user_engagement', company.shortName);
  };

  return (
    <>
      <section id="hero" className="relative min-h-screen flex items-center bg-jetblack text-white overflow-hidden">
        {/* Background avec thème corporate */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlays */}
          <div className="absolute inset-0 bg-jetblack/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 via-transparent to-blue-800/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-jetblack/20 via-transparent to-jetblack/70"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <RevealAnimation>
            {/* Logo et titre entreprise */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20 overflow-hidden">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={`Logo ${company.shortName}`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-4xl">🏢</span>
                )}
              </div>
              <h3 className="text-lg md:text-xl text-blue-300 font-medium mb-2">Programme corporate</h3>
              <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)'
              }}>
                {company.name}
              </h1>
            </div>

            {/* Container principal avec fond */}
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-center" style={{
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)'
              }}>
                <span className="drop-shadow-lg">RAYO SPORT</span>{" "}
                <span 
                  style={{
                    color: company.colors.primary,
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)'
                  }}
                  className="drop-shadow-lg"
                >
                  {company.shortName}
                </span>
              </h2>
              
              <p 
                className="text-xl md:text-2xl max-w-4xl mx-auto mb-6 text-center"
                style={{
                  textShadow: '1px 1px 4px rgba(0, 0, 0, 0.7)'
                }}
              >
                {company.description}
              </p>

              {/* Stats entreprise */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-bold text-blue-300">{company.totalEmployees}</div>
                  <div className="text-sm opacity-80">Collaborateurs</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-bold text-yellow-300">{company.sportsPrograms.length}</div>
                  <div className="text-sm opacity-80">Programmes</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-bold text-green-300">{company.totalEmployees}</div>
                  <div className="text-sm opacity-80">Employés</div>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <button 
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-xl hover:from-green-600 hover:via-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                onClick={handleJoinClick}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Rejoindre {company.shortName} Rayo</div>
                    <div className="text-xs opacity-90">Communauté corporate</div>
                  </div>
                </div>
              </button>

              <button 
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                onClick={() => {
                  trackEvent('view_company_matches_click', 'navigation', company.shortName);
                  const upcomingMatchesSection = document.getElementById('upcoming-matches');
                  if (upcomingMatchesSection) {
                    const headerHeight = 80;
                    const elementPosition = upcomingMatchesSection.offsetTop - headerHeight;
                    window.scrollTo({
                      top: elementPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
                    <span className="text-lg">⚽</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Matchs {company.shortName}</div>
                    <div className="text-xs opacity-90">Tournois & événements</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Programmes sportifs */}
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">Programmes disponibles</h3>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {company.sportsPrograms.map((program: string, index: number) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20"
                  >
                    {program}
                  </span>
                ))}
              </div>
            </div>
          </RevealAnimation>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#121212] to-transparent z-10"></div>
      </section>

      {/* Modal WhatsApp spécifique à l'entreprise */}
      <CompanyWhatsAppModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        company={company}
      />
    </>
  );
};

export default CompanyHeroSection;