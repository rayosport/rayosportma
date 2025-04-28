import { createContext, ReactNode, useState, useContext } from "react";

interface NavContextProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const NavContext = createContext<NavContextProps>({
  activeSection: "hero",
  setActiveSection: () => {},
});

interface NavProviderProps {
  children: ReactNode;
}

export const NavProvider = ({ children }: NavProviderProps) => {
  const [activeSection, setActiveSection] = useState("hero");

  return (
    <NavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNavContext = () => {
  const context = useContext(NavContext);
  return context;
};
