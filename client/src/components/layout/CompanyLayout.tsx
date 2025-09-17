import { ReactNode } from "react";
import { getCompany } from "@/config/companies";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface CompanyLayoutProps {
  children: ReactNode;
  companyCode: string;
}

const CompanyLayout = ({ children, companyCode }: CompanyLayoutProps) => {
  const company = getCompany(companyCode);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Entreprise non trouvée</h1>
          <p className="text-gray-600">L'entreprise "{companyCode}" n'existe pas dans notre système.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec personnalisation entreprise */}
      <style jsx global>{`
        :root {
          --company-primary: ${company.colors.primary};
          --company-secondary: ${company.colors.secondary};
          --company-accent: ${company.colors.accent};
        }
        .rayoblue {
          color: ${company.colors.primary} !important;
        }
        .bg-rayoblue {
          background-color: ${company.colors.primary} !important;
        }
        .border-rayoblue {
          border-color: ${company.colors.primary} !important;
        }
        .hover\\:bg-rayoblue:hover {
          background-color: ${company.colors.primary} !important;
        }
        .hover\\:text-rayoblue:hover {
          color: ${company.colors.primary} !important;
        }
        .hover\\:border-rayoblue:hover {
          border-color: ${company.colors.primary} !important;
        }
      `}</style>
      
      <Header />
      
      {/* Bannière entreprise */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">🏢</span>
            </div>
            <span className="text-sm font-medium">
              Espace corporate • {company.name}
            </span>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">⚽</span>
            </div>
          </div>
        </div>
      </div>

      {children}
      
      <Footer />
    </div>
  );
};

export default CompanyLayout;