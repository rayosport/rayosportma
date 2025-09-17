import { useLocation } from "wouter";
import { getCompany } from "@/config/companies";

export const useCompanyContext = () => {
  const [location] = useLocation();
  
  // Extract company code from URL like /entreprise/nemo
  const companyMatch = location.match(/^\/entreprise\/([^\/]+)$/);
  const companyCode = companyMatch ? companyMatch[1] : null;
  
  const company = companyCode ? getCompany(companyCode) : null;
  
  return {
    isCompanyPage: !!company,
    companyCode,
    company,
    customDataSources: company?.customDataSources || null
  };
};