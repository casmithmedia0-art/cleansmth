"use client";

import styles from "./about.module.css";
import SiteHeader from "../components/SiteHeader";
import usePublicContent from "../lib/usePublicContent";

function safeImageUrl(value) {
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
  const storyParagraphs = String(page.intro || "").split(/\n\s*\n/).filter(Boolean);
  const heroImageUrl = safeImageUrl(page.hero_image_url);

  return (
    <main className={styles.page}>
      <SiteHeader variant="service" activePage="about" />

      <section className={styles.hero} aria-labelledby="story-title">
        {heroImageUrl ? <img className={styles.heroImage} src={heroImageUrl} alt="" aria-hidden="true" /> : null}
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Our story</p>
          <h1 id="story-title">{page.hero_title}</h1>
          <p className={styles.subtitle}>{page.hero_subtitle}</p>
          <a className={styles.heroCta} href={safeActionUrl(page.hero_cta_url)}>
            {page.hero_cta_text || "Book your car wash"}
          </a>
        </div>
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
      </footer>
    </main>
  );
}
