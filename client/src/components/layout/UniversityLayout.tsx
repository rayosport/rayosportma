import { ReactNode } from "react";
import { getUniversity } from "@/config/universities";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface UniversityLayoutProps {
  children: ReactNode;
  universityCode: string;
}

const UniversityLayout = ({ children, universityCode }: UniversityLayoutProps) => {
  const university = getUniversity(universityCode);

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Université non trouvée</h1>
          <p className="text-gray-600">L'université "{universityCode}" n'existe pas dans notre système.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec personnalisation université */}
      <style jsx global>{`
        :root {
          --university-primary: ${university.colors.primary};
          --university-secondary: ${university.colors.secondary};
          --university-accent: ${university.colors.accent};
        }
        .rayoblue {
          color: ${university.colors.primary} !important;
        }
        .bg-rayoblue {
          background-color: ${university.colors.primary} !important;
        }
        .border-rayoblue {
          border-color: ${university.colors.primary} !important;
        }
        .hover\\:bg-rayoblue:hover {
          background-color: ${university.colors.primary} !important;
        }
        .hover\\:text-rayoblue:hover {
          color: ${university.colors.primary} !important;
        }
        .hover\\:border-rayoblue:hover {
          border-color: ${university.colors.primary} !important;
        }
      `}</style>
      
      <Header />
      
      {/* Bannière université */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">🏛️</span>
            </div>
            <span className="text-sm font-medium">
              Espace dédié • {university.name}
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

export default UniversityLayout;