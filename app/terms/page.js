import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Terms & Booking Policy | CLEANSMITH",
  description: "CLEANSMITH booking, service, cancellation and payment information.",
};

export default function TermsPage() {
  return (
    <div className="service-page">
      <SiteHeader variant="service" />
      <main className="legal-page">
        <section className="service-page-hero">
          <div className="service-page-hero-content">
            <p className="service-page-eyebrow">CLEANSMITH · JOHANNESBURG</p>
            <h1>Terms &amp; Booking Policy</h1>
            <p className="service-page-subtitle">A few details to make booking and service expectations clear.</p>
          </div>
        </section>
        <section className="service-page-section">
          <div className="service-section-inner legal-copy">
            <h2>Bookings and pricing</h2>
            <p>Bookings are confirmed once CLEANSMITH has agreed the service, availability, location, and price with you. Prices shown on the site are in South African rand (ZAR). Final price is confirmed before work starts; custom work and repairs are quoted individually.</p>
            <h2>Changes and cancellations</h2>
            <p>Please contact us as early as possible if you need to change or cancel a booking. Any cancellation or rescheduling arrangements will be confirmed with you directly.</p>
            <h2>Payment</h2>
            <p>Payment details and timing are confirmed when your booking is arranged. Any additional work is discussed and priced with you before it starts.</p>
            <h2>Service results</h2>
            <p>Cleaning and repair outcomes depend on the material, condition, and age of each item. We will discuss the proposed service and any limitations before proceeding.</p>
            <h2>Contact</h2>
            <p>For questions about these terms, email <a href="mailto:info@cleansmith.co.za">info@cleansmith.co.za</a> or call <a href="tel:+27717856901">071 785 6901</a>.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
