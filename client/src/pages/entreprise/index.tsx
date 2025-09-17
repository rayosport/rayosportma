import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { getAllCompanies } from "@/config/companies";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { Link } from "wouter";

// Modal pour proposer une nouvelle entreprise
const ProposeCompanyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employeesCount: '',
    sector: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('company_proposal_submitted', 'partnership', formData.companyName);
    
    // Construire le message WhatsApp
    const message = `🏢 *NOUVELLE DEMANDE ENTREPRISE*
    
📋 *Détails de l'entreprise:*
• Nom: ${formData.companyName}
• Secteur: ${formData.sector || 'Non spécifié'}
• Nombre de collaborateurs: ${formData.employeesCount || 'Non spécifié'}

👤 *Contact:*
• Nom: ${formData.contactName}
• Email: ${formData.email}
• Téléphone: ${formData.phone || 'Non fourni'}

💬 *Message:*
${formData.message || 'Aucun message supplémentaire'}

---
Demande générée depuis le site Rayo Sport Corporate`;

    // Encoder le message pour WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/212649076758?text=${encodedMessage}`;
    
    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Confirmation
    alert('Merci ! Votre demande a été envoyée via WhatsApp. Nous vous contacterons rapidement.');
    onClose();
    
    // Reset form
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      employeesCount: '',
      sector: '',
      message: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto bg-white border-none shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Proposer votre entreprise
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <p className="text-center text-gray-600 mb-6">
            Intéressé par un programme sportif corporate avec Rayo Sport ? Remplissez ce formulaire et nous vous contacterons rapidement.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: CDG Capital"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom complet *
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom et prénom"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email professionnel *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@entreprise.ma"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+212 6XX-XXX-XXX"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité
              </label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un secteur</option>
                <option value="finance">Finance & Banque</option>
                <option value="telecom">Télécommunications</option>
                <option value="transport">Transport & Logistique</option>
                <option value="energie">Énergie & Utilities</option>
                <option value="industrie">Industrie & Manufacturing</option>
                <option value="technologie">Technologie & IT</option>
                <option value="immobilier">Immobilier & Construction</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de collaborateurs
              </label>
              <input
                type="text"
                name="employeesCount"
                value={formData.employeesCount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 200+ collaborateurs"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optionnel)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez brièvement vos objectifs pour un programme sportif corporate..."
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold"
            >
              Envoyer la proposition
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CompaniesHubPage = () => {
  const { t } = useLanguage();
  const companies = getAllCompanies();
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=2026&q=80')`
            }}
          ></div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <RevealAnimation>
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <span className="text-4xl">🏢</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Rayo Sport <span className="text-yellow-300">Corporate</span>
              </h1>
              <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 opacity-90">
                Programmes sportifs sur-mesure pour les entreprises marocaines qui souhaitent renforcer la cohésion d'équipe
              </p>
              
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-yellow-300">{companies.length}</div>
                  <div className="text-sm opacity-80">Entreprises partenaires</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-green-300">1500+</div>
                  <div className="text-sm opacity-80">Collaborateurs actifs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-blue-300">15+</div>
                  <div className="text-sm opacity-80">Programmes corporate</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-red-300">2024</div>
                  <div className="text-sm opacity-80">Lancement</div>
                </div>
              </div>
            </RevealAnimation>
          </div>
        </section>

        {/* Entreprises partenaires */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <RevealAnimation>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-600 to-gray-800 bg-clip-text text-transparent">
                  Nos Partenaires Corporate
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Découvrez les entreprises qui ont rejoint le mouvement Rayo Sport Corporate pour dynamiser leurs équipes
                </p>
              </div>
            </RevealAnimation>

            {/* Grille des entreprises */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {companies.map((company, index) => (
                <RevealAnimation key={company.code} delay={index * 0.1}>
                  <Link href={`/entreprise/${company.code}`}>
                    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-blue-500/30 group cursor-pointer h-full">
                      {/* Logo placeholder */}
                      <div 
                        className="w-20 h-20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto"
                        style={{ backgroundColor: company.colors.primary }}
                      >
                        <span className="text-3xl font-bold text-white">🏢</span>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                          {company.shortName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 font-medium">
                          {company.name}
                        </p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <span>🏭</span>
                            <span>{company.sector}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span>📍</span>
                            <span>{company.location}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span>👥</span>
                            <span>{company.totalEmployees} collaborateurs</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span>⚽</span>
                            <span>{company.sportsPrograms.length} programmes</span>
                          </div>
                        </div>

                        {/* Programmes sportifs */}
                        <div className="mt-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            {company.sportsPrograms.slice(0, 2).map((program, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                              >
                                {program}
                              </span>
                            ))}
                            {company.sportsPrograms.length > 2 && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                +{company.sportsPrograms.length - 2}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <div 
                            className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-300 group-hover:shadow-lg"
                            style={{ backgroundColor: company.colors.primary }}
                          >
                            Voir l'espace corporate →
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </RevealAnimation>
              ))}

              {/* Carte "Proposer votre entreprise" */}
              <RevealAnimation delay={companies.length * 0.1}>
                <div 
                  onClick={() => {
                    setIsProposeModalOpen(true);
                    trackEvent('propose_company_click', 'partnership', 'hub_page');
                  }}
                  className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-dashed border-gray-300 hover:border-blue-500 group cursor-pointer h-full flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl font-bold text-blue-600">+</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-gray-700 group-hover:text-blue-600 transition-colors">
                    Votre entreprise ?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Proposer un programme sportif corporate
                  </p>
                  
                  <div className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium text-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-lg">
                    Proposer un partenariat
                  </div>
                </div>
              </RevealAnimation>
            </div>
          </div>
        </section>

        {/* Section avantages */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <RevealAnimation>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-600 to-gray-800 bg-clip-text text-transparent">
                  Pourquoi un programme corporate ?
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Les avantages d'un programme sportif Rayo Sport pour votre entreprise
                </p>
              </div>
            </RevealAnimation>

            <div className="grid md:grid-cols-3 gap-8">
              <RevealAnimation delay={0.1}>
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <span className="text-2xl font-bold text-white">🤝</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Team Building</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Renforcez la cohésion d'équipe et créez des liens durables entre vos collaborateurs
                  </p>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.2}>
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <span className="text-2xl font-bold text-white">💪</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Bien-être des équipes</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Proposez une activité sportive régulière pour améliorer la santé et le moral de vos équipes
                  </p>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.3}>
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <span className="text-2xl font-bold text-white">🏆</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Image d'entreprise</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Valorisez votre marque employeur avec un programme sportif innovant et engageant
                  </p>
                </div>
              </RevealAnimation>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modal proposition entreprise */}
      <ProposeCompanyModal 
        isOpen={isProposeModalOpen}
        onClose={() => setIsProposeModalOpen(false)}
      />
    </>
  );
};

export default CompaniesHubPage;