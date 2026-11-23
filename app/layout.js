import Script from "next/script";
import WhatsAppButton from "./components/WhatsAppButton";
import "./globals.css";
import "./service-pages.css";

export const metadata = {
  metadataBase: new URL("https://www.cleansmith.co.za"),
  title: "CLEANSMITH | Mobile Car Wash, Home Cleaning & Sneaker Cleaning | Johannesburg",
  description: "Mobile car wash, home cleaning, gardening and sneaker cleaning across Johannesburg. We come to you. Book via WhatsApp.",
  icons: {
    icon: "/favicon-96x96.png",
    shortcut: "/favicon-96x96.png",
    apple: "/favicon-96x96.png",
  },
};

const businessData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.cleansmith.co.za/#business",
  name: "CLEANSMITH",
  url: "https://www.cleansmith.co.za",
  telephone: "+27717856901",
  email: "info@cleansmith.co.za",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Johannesburg",
    addressRegion: "Gauteng",
    addressCountry: "ZA",
  },
  areaServed: ["Johannesburg", "Gauteng"],
  serviceType: ["Mobile car wash", "Home cleaning", "Gardening", "Sneaker cleaning", "Shoe repairs"],
  openingHours: "Mo-Su 07:00-17:00",
  sameAs: [
    "https://www.facebook.com/profile.php?id=61586060377430",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }} />
        {children}
        <WhatsAppButton />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="beforeInteractive"
        />
        <Script src="/supabase-config.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
