"use client";

import Link from "next/link";
import { useState } from "react";
import FAQSection from "./FAQSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { getPageHeroSlides } from "../lib/site-content";
import useHeroCarousel from "../lib/useHeroCarousel";
import usePublicContent from "../lib/usePublicContent";

const services = [
  {
    title: "Classic Cleanse",
    description: "An everyday refresh for sneakers and shoes.",
    price: "R100 per pair",
    features: ["Upper, midsole and undersole", "Laces cleaned"],
  },
  {
    title: "Red Detail",
    description: "Premium footwear detailing: deep clean and protect.",
    price: "R200 per pair",
    features: ["Deep clean inside and out", "VIS Protector Spray finish"],
  },
  {
    title: "Sneaker & Shoe Repairs",
    description: "Sole repairs, glue-downs, stitching and more.",
    price: "Free quote",
    features: ["Repairs priced individually", "Send photos for an assessment"],
  },
];

const comparisonRows = [
  ["Upper, midsole and undersole", true, true],
  ["Laces cleaned", true, true],
  ["Inner sole clean", false, true],
  ["Treats set-in stains", false, true],
  ["Deodorising treatment", false, true],
  ["VIS Protector Spray finish", false, true],
  ["Best for", "Everyday refresh", "Deep clean and protect"],
  ["Price per pair", "R100", "R200"],
];

const steps = [
  ["01", "Drop off or book collection"],
  ["02", "We clean or repair"],
  ["03", "Collect your fresh pair"],
];

function safeMediaUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
}

function ReviewIcon({ included }) {
  return (
    <span className={included ? "comparison-yes" : "comparison-no"} aria-label={included ? "Included" : "Not included"}>
      {included ? "✓" : "–"}
    </span>
  );
}

function RepairQuoteForm() {
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

  async function submitQuote(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const photo = values.get("photo");

    if (photo && photo.size > 10 * 1024 * 1024) {
      setStatusIsError(true);
      setStatus("Please choose an image smaller than 10 MB.");
      return;
    }

    const message = [
      "Hi CLEANSMITH, I would like a free sneaker or shoe repair quote.",
      `Name: ${values.get("name")}`,
      `Phone/WhatsApp: ${values.get("phone")}`,
      `Shoe type: ${values.get("shoeType")}`,
      `Issue: ${values.get("issue")}`,
      photo && photo.name ? `Photo selected: ${photo.name}` : "I will attach photos in this chat.",
    ].join("\n");
    const whatsappUrl = `https://wa.me/27717856901?text=${encodeURIComponent(message)}`;
    const canSharePhoto = photo && photo.size > 0 && navigator.canShare &&
      navigator.canShare({ files: [photo] }) && navigator.share;

    setStatusIsError(false);
    if (canSharePhoto) {
      try {
        await navigator.share({
          title: "CLEANSMITH repair quote",
          text: message,
          files: [photo],
        });
        setStatus("Your share sheet has closed. Please make sure the request was sent.");
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Unable to share the CLEANSMITH repair photo:", error);
      }
    }

    const whatsappLink = document.createElement("a");
    whatsappLink.href = whatsappUrl;
    whatsappLink.target = "_blank";
    whatsappLink.rel = "noopener noreferrer";
    document.body.appendChild(whatsappLink);
    whatsappLink.click();
    whatsappLink.remove();
    setStatus(photo && photo.size > 0
      ? "WhatsApp opened. Attach your selected photo in the chat before sending."
      : "WhatsApp opened. Add photos in the chat to help us assess the repair.");
  }

  return (
    <form className="repair-quote-form" onSubmit={submitQuote}>
      <div className="repair-form-grid">
        <label>
          Name *
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Phone / WhatsApp *
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
        <label>
          Shoe type *
          <input name="shoeType" placeholder="For example, leather boots" required />
        </label>
        <label className="repair-form-wide">
          Describe the issue *
          <textarea name="issue" rows={4} required placeholder="Tell us what needs repair" />
        </label>
        <label className="repair-form-wide">
          Add a photo (optional, max 10 MB)
          <input name="photo" type="file" accept="image/*" />
          <span className="repair-form-help">On devices that support sharing, your photo can be attached directly. Otherwise, add it in WhatsApp after the chat opens.</span>
        </label>
      </div>
      <button className="service-hero-cta" type="submit">Send repair request</button>
      <p className={statusIsError ? "repair-form-status error" : "repair-form-status"} role="status" aria-live="polite">{status}</p>
    </form>
  );
}

export default function SneakerCleaningPage() {
  const { pages } = usePublicContent();
  const page = pages["sneaker-cleaning"];
  const slides = getPageHeroSlides(page);
  const { activeIndex, activeSlide, goTo, next, previous } = useHeroCarousel(slides);
  const heroImage = safeMediaUrl(activeSlide.image_url);
  const heroVideo = safeMediaUrl(activeSlide.video_url);
  const sneakerBooking = `https://wa.me/27717856901?text=${encodeURIComponent("Hi CLEANSMITH, I would like to book a sneaker clean.")}`;
  const whatsappRepair = `https://wa.me/27717856901?text=${encodeURIComponent("Hi CLEANSMITH, I would like a free sneaker or shoe repair quote. I will send photos of the shoes in this chat.")}`;

  return (
    <div className="service-page sneaker-page">
      <SiteHeader variant="service" activePage="sneaker-cleaning" />
      <main>
        <section className="service-page-hero sneaker-hero">
          {heroVideo ? (
            <video key={activeIndex} className="service-hero-image sneaker-hero-video" aria-label="Play CLEANSMITH sneaker service video" muted loop playsInline controls preload="none" poster={heroImage || "/bike.jpeg"}>
              <source src={heroVideo} />
            </video>
          ) : heroImage ? (
            <img key={activeIndex} className="service-hero-image hero-slide-image" src={heroImage} alt="Sneaker cleaning and footwear detailing" />
          ) : null}
          <div className="service-page-hero-content">
            <p className="service-page-eyebrow">Sneaker cleaning · Footwear detailing · Johannesburg</p>
            <h1>{activeSlide.title || page.hero_title}</h1>
            <p className="service-page-subtitle">{activeSlide.subtitle || page.hero_subtitle}</p>
            <div className="sneaker-hero-actions">
              <a className="service-hero-cta" href={sneakerBooking} target="_blank" rel="noopener noreferrer">Book a Clean</a>
              <Link className="service-hero-cta secondary" href="#repair-quote">Request a Quote</Link>
            </div>
          </div>
          {slides.length > 1 ? (
            <div className="hero-carousel-controls" aria-label="Hero slideshow controls">
              <button type="button" aria-label="Previous hero slide" onClick={previous}>‹</button>
              <div className="hero-carousel-dots">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.image_url}-${slide.video_url}-${index}`}
                    type="button"
                    aria-label={`Show hero slide ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => goTo(index)}
                  />
                ))}
              </div>
              <button type="button" aria-label="Next hero slide" onClick={next}>›</button>
            </div>
          ) : null}
        </section>

        <section className="service-page-section">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Our services</p>
            <h2>Footwear care, your way</h2>
            <p className="service-page-intro">From an everyday refresh to a deep clean or repair, we will help you choose the right service for your pair.</p>
            <div className="sneaker-service-grid">
              {services.map((service, index) => (
                <article className="sneaker-service-card" key={service.title}>
                  <span className="service-card-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <strong>{service.price}</strong>
                  <ul>{service.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="service-page-section sneaker-comparison-section">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Choose your clean</p>
            <h2>Classic Cleanse vs Red Detail</h2>
            <p className="service-page-intro">Not sure which one you need? Here is how the two cleans compare.</p>
            <div className="sneaker-comparison-scroll" role="region" aria-label="Classic Cleanse and Red Detail comparison" tabIndex="0">
              <table className="sneaker-comparison-table">
                <thead>
                  <tr>
                    <th scope="col">What&apos;s included</th>
                    <th scope="col">Classic Cleanse</th>
                    <th scope="col">Red Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([label, classic, red]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{typeof classic === "boolean" ? <ReviewIcon included={classic} /> : classic}</td>
                      <td>{typeof red === "boolean" ? <ReviewIcon included={red} /> : red}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sneaker-price-note">Prices are per pair in ZAR and will be confirmed before work starts.</p>
          </div>
        </section>

        <section className="service-page-section sneaker-repair-section" id="repairs">
          <div className="service-section-inner sneaker-repair-grid">
            <div>
              <p className="service-page-eyebrow">Care beyond cleaning</p>
              <h2>Sneaker &amp; Shoe Repairs</h2>
              <p className="service-page-intro">Sole repairs, glue-downs, stitching and more. Every repair is priced individually, so send us photos for a free quote.</p>
              <div className="sneaker-repair-actions">
                <a className="service-hero-cta" href="#repair-quote">Get a Repair Quote</a>
                <a className="service-hero-cta secondary" href={whatsappRepair} target="_blank" rel="noopener noreferrer">Send photos for a quote on WhatsApp</a>
              </div>
            </div>
            <div className="repair-form-panel" id="repair-quote">
              <h3>Request a repair quote</h3>
              <RepairQuoteForm />
            </div>
          </div>
        </section>

        <section className="service-page-section">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Simple from start to finish</p>
            <h2>How it works</h2>
            <div className="sneaker-steps">
              {steps.map(([number, label]) => (
                <article className="sneaker-step" key={number}>
                  <span>{number}</span>
                  <h3>{label}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="service-page-section sneaker-photo-section">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Our work</p>
            <h2>Sneaker before &amp; after</h2>
            <p className="service-page-intro">Real customer before-and-after photos will be added here.</p>
            <div className="sneaker-photo-grid" aria-label="Sneaker before-and-after photo placeholders">
              <div className="sneaker-photo-placeholder"><span>Before</span><strong>Sneaker photo coming soon</strong></div>
              <div className="sneaker-photo-placeholder"><span>After</span><strong>Sneaker photo coming soon</strong></div>
            </div>
          </div>
        </section>

        <FAQSection service="sneaker-cleaning" />

        <section className="service-page-section sneaker-final-cta">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">CLEANSMITH · JOHANNESBURG</p>
            <h2>Ready to refresh your sneakers?</h2>
            <div className="sneaker-hero-actions">
              <a className="service-hero-cta" href={sneakerBooking} target="_blank" rel="noopener noreferrer">Book Now</a>
              <a className="service-hero-cta secondary" href="https://wa.me/27717856901?text=Hi%20CLEANSMITH%2C%20I%27d%20like%20to%20book%20a%20sneaker%20clean." target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
