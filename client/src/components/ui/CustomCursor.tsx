import { useState, useEffect } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  // Fonction pour vérifier si un élément est interactif
  const isInteractiveElement = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    
    // Liste des balises interactives communes
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
    
    // Liste des classes CSS qui indiquent des éléments interactifs
    const interactiveClasses = ['cursor-pointer', 'btn', 'btn-primary', 'btn-outline', 'btn-white', 
      'btn-outline-white', 'accordion-trigger', 'tabs-trigger'];
    
    // Vérifier la balise HTML
    if (interactiveTags.includes(element.tagName)) {
      return true;
    }
    
    // Vérifier les classes CSS
    for (const className of interactiveClasses) {
      if (element.classList.contains(className)) {
        return true;
      }
    }
    
    // Vérifier si l'élément a un événement onclick ou un rôle interactif
    if (element.hasAttribute('onclick') || 
        element.getAttribute('role') === 'button' ||
        element.getAttribute('role') === 'link' ||
        element.getAttribute('tabindex') === '0') {
      return true;
    }
    
    // Vérifier les parents (pour les éléments imbriqués dans des boutons ou liens)
    if (element.closest('a') || 
        element.closest('button') || 
        element.closest('[role="button"]') ||
        element.closest('.cursor-pointer')) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Vérifier si l'élément sous le curseur est interactif
      const target = e.target as HTMLElement;
      setLinkHovered(isInteractiveElement(target));
    };

    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);
    
    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Ajouter une classe au body pour les styles spécifiques
    document.body.classList.add('custom-cursor-enabled');

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      
      // Nettoyer la classe au démontage
      document.body.classList.remove('custom-cursor-enabled');
    };
  }, []);

  // Ne pas rendre le curseur personnalisé sur les appareils tactiles
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      {/* Curseur personnalisé */}
      <div 
        className={`custom-cursor ${visible ? 'opacity-100' : 'opacity-0'} ${clicked ? 'scale-75' : ''} ${linkHovered ? 'scale-150' : ''} fixed w-6 h-6 rounded-full border-2 border-rayoblue pointer-events-none z-[9999] transition-transform duration-150`} 
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: `translate(-50%, -50%)`,
        }}
      />
      
      {/* Point central du curseur */}
      <div 
        className={`custom-cursor-dot ${visible ? 'opacity-100' : 'opacity-0'} fixed w-1 h-1 bg-white rounded-full pointer-events-none z-[9999]`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: `translate(-50%, -50%)`,
        }}
      />
      
      {/* Styles globaux pour le curseur */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Curseur personnalisé seulement sur les éléments non interactifs */
          body.custom-cursor-enabled {
            cursor: none;
          }
          
          /* Rétablir le curseur sur les éléments interactifs */
          body.custom-cursor-enabled a,
          body.custom-cursor-enabled button,
          body.custom-cursor-enabled input,
          body.custom-cursor-enabled select,
          body.custom-cursor-enabled textarea,
          body.custom-cursor-enabled [role="button"],
          body.custom-cursor-enabled [tabindex="0"],
          body.custom-cursor-enabled .cursor-pointer,
          body.custom-cursor-enabled .btn,
          body.custom-cursor-enabled .accordion-trigger,
          body.custom-cursor-enabled .tabs-trigger {
            cursor: pointer !important;
          }
          
          /* Désactiver sur les appareils tactiles */
          @media (pointer: coarse) {
            body.custom-cursor-enabled {
              cursor: auto !important;
            }
          }
        `
      }} />
    </>
  );
};

export default CustomCursor;