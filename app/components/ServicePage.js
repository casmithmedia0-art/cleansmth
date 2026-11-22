"use client";

import Link from "next/link";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import WorkGallery from "./WorkGallery";
import FAQSection from "./FAQSection";
import { getPageHeroSlides } from "../lib/site-content";
import useHeroCarousel from "../lib/useHeroCarousel";
import usePublicContent from "../lib/usePublicContent";

function safeImageUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
}

function safeActionUrl(value, fallback) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || /^(mailto|tel):/i.test(url) ? url : fallback;
}

export default function ServicePage({ slug }) {
  const { pages, gallery, packages } = usePublicContent();
  const page = pages[slug];
  const heroSlides = getPageHeroSlides(page);
  const { activeIndex, activeSlide, goTo, next, previous } = useHeroCarousel(heroSlides);
  const services = Array.isArray(page.services) ? page.services : [];
  const pageGallery = gallery.filter((item) => (item.service_slug || "car-wash") === slug);
  const pagePackages = packages.filter((item) => item.service_slug === slug);
  const quoteText = slug === "home-cleaning"
    ? "Hi CLEANSMITH, I would like a home cleaning quote."
    : "Hi CLEANSMITH, I would like a gardening quote.";

  return (
    <div className="service-page">
      <SiteHeader variant="service" activePage={slug} />
      <main>
        <section className="service-page-hero">
          {safeImageUrl(activeSlide.image_url) ? (
            <img key={activeIndex} className="service-hero-image hero-slide-image" src={safeImageUrl(activeSlide.image_url)} alt="" aria-hidden="true" />
          ) : null}
          <div className="service-page-hero-content">
            <div key={activeIndex} className="hero-slide-copy" aria-live="polite" aria-atomic="true">
              <p className="service-page-eyebrow">CLEANSMITH · JOHANNESBURG</p>
              <h1>{activeSlide.title || page.hero_title}</h1>
              <p className="service-page-subtitle">{activeSlide.subtitle || page.hero_subtitle}</p>
              <Link
                className="service-hero-cta"
                href={safeActionUrl(
                  activeSlide.cta_url,
                  `https://wa.me/27717856901?text=${encodeURIComponent(quoteText)}`,
                )}
              >
                {activeSlide.cta_text || "Request a quote"}
              </Link>
            </div>
          </div>
          {heroSlides.length > 1 ? (
            <div className="hero-carousel-controls" aria-label="Hero slideshow controls">
              <button type="button" aria-label="Previous hero slide" onClick={previous}>‹</button>
              <div className="hero-carousel-dots">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.image_url}-${index}`}
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
            <p className="service-page-eyebrow">{slug === "gardening" ? "Care for your outdoor space" : "Cleaning that fits your home"}</p>
            <h2>{page.section_title}</h2>
            <p className="service-page-intro">{page.intro}</p>
            <div className="service-card-grid">
              {services.map((service, index) => (
                <article className="service-card" key={`${service.title}-${index}`}>
                  {safeImageUrl(service.image_url) ? (
                    <img className="service-card-image" src={safeImageUrl(service.image_url)} alt={service.title || "CLEANSMITH service"} loading="lazy" />
                  ) : null}
                  <div className="service-card-body">
                    <p className="service-card-number">{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="service-card-title">{service.title}</h3>
                    <p className="service-card-description">{service.description}</p>
                    {service.price_label ? <p className="service-card-price">{service.price_label}</p> : null}
                    {service.features?.length ? (
                      <ul className="service-card-features">
                        {service.features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        {pagePackages.length ? (
          <section className="service-page-section service-packages">
            <div className="service-section-inner">
              <p className="service-page-eyebrow">Service packages</p>
              <h2>{slug === "gardening" ? "Garden care packages" : "Home-cleaning packages"}</h2>
              <p className="service-page-intro">Choose the service that best fits your space. We will confirm the details and availability with you.</p>
              <div className="service-package-grid">
                {pagePackages.map((item) => (
                  <article className="service-package-card" key={item.id || item.slug}>
                    {item.badge ? <p className="service-package-badge">{item.badge}</p> : null}
                    <h3>{item.name}</h3>
                    <p className="service-package-price">
                      {Number(item.starting_price) > 0
                        ? `From R${Number(item.starting_price).toLocaleString("en-ZA")}`
                        : "Request a quote"}
                      {Number(item.starting_price) > 0 && item.price_unit ? <span> / {item.price_unit}</span> : null}
                    </p>
                    {item.duration ? <p className="service-package-duration">{item.duration}</p> : null}
                    {item.description ? <p className="service-package-description">{item.description}</p> : null}
                    {item.features?.length ? (
                      <ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                    ) : null}
                    <Link href={`https://wa.me/27717856901?text=${encodeURIComponent(`Hi CLEANSMITH, I would like a quote for the ${item.name} ${slug === "gardening" ? "gardening" : "home-cleaning"} package.`)}`}>
                      Request this package
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        <section className="service-page-section">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Recent work</p>
            <h2>{slug === "gardening" ? "Garden gallery" : "Home-cleaning gallery"}</h2>
            <WorkGallery
              items={pageGallery}
              emptyMessage={`Our ${slug === "gardening" ? "gardening" : "home-cleaning"} gallery is being updated. Check back soon.`}
            />
          </div>
        </section>
        <FAQSection service={slug} />
        <section className="service-page-section service-page-cta">
          <div className="service-section-inner">
            <p className="service-page-eyebrow">Get started</p>
            <h2>{page.callout_title}</h2>
            <p>{page.callout_text}</p>
            <Link href={`https://wa.me/27717856901?text=${encodeURIComponent(quoteText)}`}>
              Request a {slug === "gardening" ? "gardening" : "home-cleaning"} quote
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
