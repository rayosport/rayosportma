export interface ConceptFeature {
  icon: JSX.Element;
  title: string;
  description: string;
}

export interface Product {
  image: string;
  title: string;
  description: string;
  delay?: number;
}

export interface Feature {
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

export interface ContactInfo {
  icon: JSX.Element;
  title: string;
  content: string;
}

export interface OpeningHours {
  day: string;
  hours: string;
}

export interface SocialLink {
  icon: JSX.Element;
  href?: string;
}
