import { useLanguage } from "@/hooks/use-language";
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

const Footer = () => {
  const { t, setLanguage } = useLanguage();
  
  return (
    <footer className="bg-jetblack text-white pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1 - About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Rayo Sport</h3>
            <p className="text-gray-400 mb-4">
              {t("footer_about")}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/rayosport.ma/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rayoblue transition-colors">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-rayoblue transition-colors">
                <FaWhatsapp size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-rayoblue transition-colors">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-rayoblue transition-colors">
                <FaTiktok size={24} />
              </a>
            </div>
          </div>
          
          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t("footer_quick_links")}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  {t("nav_about")}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                  {t("nav_how")}
                </a>
              </li>
              <li>
                <a href="#rules" className="text-gray-400 hover:text-white transition-colors">
                  {t("nav_rules")}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                  {t("nav_faq")}
                </a>
              </li>
            </ul>
          </div>
          
          {/* Column 3 - Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t("footer_contact")}</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                <span className="block">{t("footer_address")}</span>
              </li>
              <li>
                <a href="mailto:info@rayosport.com" className="text-gray-400 hover:text-white transition-colors">
                  info@rayosport.com
                </a>
              </li>
              <li>
                <a href="tel:+212522000000" className="text-gray-400 hover:text-white transition-colors">
                  +212 522 000 000
                </a>
              </li>
            </ul>
          </div>
          
          {/* Column 4 - Language */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t("footer_language")}</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setLanguage('fr')}
                className="block w-full text-left px-4 py-2 rounded bg-darkgrey text-gray-300 hover:bg-rayoblue hover:text-white transition-colors"
              >
                Français
              </button>
              <button 
                onClick={() => setLanguage('ar')}
                className="block w-full text-left px-4 py-2 rounded bg-darkgrey text-gray-300 hover:bg-rayoblue hover:text-white transition-colors"
              >
                العربية
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Rayo Sport. {t("footer_rights")}
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t("footer_privacy")}
              </a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t("footer_terms")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;