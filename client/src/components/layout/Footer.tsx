import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white w-full">
      <div className="max-w-7xl mx-auto px-4 py-4 w-full">
        {/* Row 1 - Social, Contact */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-3">
          {/* Social Media */}
          <div className="flex gap-2">
            <a href="https://www.instagram.com/rayosport.ma/?hl=en" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-700 hover:bg-pink-600 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105">
              <FaInstagram size={12} />
            </a>
            <a href="https://wa.me/+212649076758?text=Salut%20!%20Je%20suis%20intéressé%20par%20Rayo%20Sport.%20Pouvez-vous%20me%20donner%20plus%20d'informations%20?" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105">
              <FaWhatsapp size={12} />
            </a>
            <a href="https://www.facebook.com/people/RAYO-SPORT/61575298053441/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105">
              <FaFacebook size={12} />
            </a>
          </div>

          {/* Contact Info */}
          <div className="flex gap-4">
            <a href="mailto:contact@rayosport.ma" className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors duration-200">
              <FiMail className="w-3 h-3" />
              <span>contact@rayosport.ma</span>
            </a>
            <a href="https://wa.me/+212649076758" className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors duration-200">
              <FiPhone className="w-3 h-3" />
              <span>+212 649-076758</span>
            </a>
          </div>
        </div>

        {/* Row 2 - Copyright & Made with Love */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-700">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Rayo Sport. Tous droits réservés.
          </p>
          <p className="text-gray-500 text-xs">
            Made with ❤️ in Morocco
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;