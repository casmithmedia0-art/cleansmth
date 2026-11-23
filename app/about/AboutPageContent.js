"use client";

import styles from "./about.module.css";
import SiteHeader from "../components/SiteHeader";
import PoweredBy from "../components/PoweredBy";
import { getPageHeroSlides } from "../lib/site-content";
import useHeroCarousel from "../lib/useHeroCarousel";
import usePublicContent from "../lib/usePublicContent";

function safeImageUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
}

function safeMediaUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
}

function safeActionUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || /^(mailto|tel):/i.test(url)
    ? url
    : "/#booking";
}

export default function AboutPageContent() {
  const { pages, teamMembers } = usePublicContent();
  const page = pages.about;
  const heroSlides = getPageHeroSlides(page);
  const { activeIndex, activeSlide, goTo, next, previous } = useHeroCarousel(heroSlides);
  const storyParagraphs = String(page.intro || "").split(/\n\s*\n/).filter(Boolean);
  const heroImageUrl = safeImageUrl(activeSlide.image_url);
  const heroVideoUrl = safeMediaUrl(activeSlide.video_url);

  return (
    <main className={styles.page}>
      <SiteHeader variant="service" activePage="about" />

      <section className={styles.hero} aria-labelledby="story-title">
        {heroVideoUrl ? (
          <video key={activeIndex} className={`${styles.heroImage} ${styles.heroVideo}`} aria-label="Play CLEANSMITH story video" muted loop playsInline controls preload="none" poster={heroImageUrl || "/bike.jpeg"}>
            <source src={heroVideoUrl} />
          </video>
        ) : heroImageUrl ? (
          <img key={activeIndex} className={`${styles.heroImage} hero-slide-image`} src={heroImageUrl} alt="" aria-hidden="true" />
        ) : null}
        <div className={`${styles.heroContent} hero-slide-copy`} key={activeIndex}>
          <p className={styles.eyebrow}>Our story</p>
          <h1 id="story-title">{activeSlide.title || page.hero_title}</h1>
          <p className={styles.subtitle}>{activeSlide.subtitle || page.hero_subtitle}</p>
          <a className={styles.heroCta} href={safeActionUrl(activeSlide.cta_url)}>
            {activeSlide.cta_text || "Book your car wash"}
          </a>
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

      <section className={styles.story} aria-label="The CleanSmith story">
        {storyParagraphs.map((paragraph, index) => (
          <p className={index === 0 ? styles.lead : undefined} key={`${index}-${paragraph.slice(0, 24)}`}>
            {paragraph}
          </p>
        ))}
      </section>

      <section className={styles.team} aria-labelledby="team-title">
        <div className={styles.teamCard}>
          <p className={styles.eyebrow}>{page.callout_title}</p>
          <h2 id="team-title">{page.section_title}</h2>
          <p>{page.callout_text}</p>
        </div>
        {teamMembers.length ? (
          <div className={styles.teamGrid}>
            {teamMembers.map((member) => (
              <article className={styles.teamMember} key={member.id}>
                {member.image_url ? (
                  <img className={styles.teamPhoto} src={member.image_url} alt={member.name} loading="lazy" />
                ) : (
                  <div className={styles.teamInitials} aria-hidden="true">
                    {member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div className={styles.teamInfo}>
                  <h3>{member.name}</h3>
                  {member.role ? <p className={styles.teamRole}>{member.role}</p> : null}
                  {member.description ? <p>{member.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <footer className={styles.footer}>
        <a href="/">CLEANSMITH</a>
        <a href="/#booking">Book your car wash</a>
        <a href="/sneaker-cleaning">Sneaker cleaning</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <span>Operating hours: Daily, 07:00–17:00</span>
        <span>Cancellations: Please contact us as early as possible. Final price confirmed before work starts; payment details confirmed when booking.</span>
        <span>© {new Date().getFullYear()} CLEANSMITH. All rights reserved.</span>
        <PoweredBy />
      </footer>
    </main>
  );
}
