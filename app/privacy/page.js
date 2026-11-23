import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Privacy Notice | CLEANSMITH",
  description: "How CLEANSMITH uses the contact and booking information you provide.",
};

export default function PrivacyPage() {
  return (
    <div className="service-page">
      <SiteHeader variant="service" />
      <main className="legal-page">
        <section className="service-page-hero">
          <div className="service-page-hero-content">
            <p className="service-page-eyebrow">CLEANSMITH · JOHANNESBURG</p>
            <h1>Privacy Notice</h1>
            <p className="service-page-subtitle">We use the details you share to respond to your enquiries and arrange services.</p>
          </div>
        </section>
        <section className="service-page-section">
          <div className="service-section-inner legal-copy">
            <h2>Information you provide</h2>
            <p>When you contact or book CLEANSMITH, you may provide your name, phone number, email address, service address, booking details, and photos relevant to a cleaning or repair quote.</p>
            <h2>How information is used</h2>
            <p>We use this information to answer enquiries, prepare quotes, confirm bookings, provide the requested service, and communicate with you about it.</p>
            <h2>Sharing and storage</h2>
            <p>Information is shared only when needed to arrange or provide the service, or when required by law. Please avoid sending sensitive personal information that is not needed for your request.</p>
            <h2>Your choices</h2>
            <p>You may ask us to update or delete information you have sent, subject to records we must retain by law. Contact <a href="mailto:info@cleansmith.co.za">info@cleansmith.co.za</a> for privacy requests.</p>
            <h2>Contact</h2>
            <p>For privacy questions, call <a href="tel:+27717856901">071 785 6901</a> or email <a href="mailto:info@cleansmith.co.za">info@cleansmith.co.za</a>.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
