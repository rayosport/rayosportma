import { useEffect } from "react";
import { useNavContext } from "@/context/NavContext";

export const useNav = () => {
  const { setActiveSection } = useNavContext();

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.offsetHeight;
      
      // Check if we're at the bottom of the page
      if (scrollY + windowHeight >= documentHeight - 10) {
        // Find the last section with an ID
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.id) {
          setActiveSection(lastSection.id);
          return;
        }
      }
      
      // Otherwise, find which section is currently visible
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop - 100;  // 100px offset for header
        const sectionHeight = (section as HTMLElement).offsetHeight;
        
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          if (section.id) {
            setActiveSection(section.id);
          }
        }
      });
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setActiveSection]);
}