"use client";

import { useState } from "react";

function safeMediaUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
}

function BeforeAfterComparison({ item }) {
  const [position, setPosition] = useState(50);
  const beforeUrl = safeMediaUrl(item.before_media_url);
  const afterUrl = safeMediaUrl(item.after_media_url);

  return (
    <div className="gallery-before-after" style={{ "--compare-position": `${position}%` }}>
      <img className="gallery-before-image" src={beforeUrl} alt={`${item.alt_text || item.title || "Service work"} before`} loading="lazy" />
      <div className="gallery-after-image" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <img src={afterUrl} alt={`${item.alt_text || item.title || "Service work"} after`} loading="lazy" />
      </div>
      <span className="gallery-compare-label gallery-compare-before">Before</span>
      <span className="gallery-compare-label gallery-compare-after-label">After</span>
      <div className="gallery-compare-divider" aria-hidden="true" />
      <input
        className="gallery-compare-input"
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label={`Compare before and after: ${item.title || "service work"}`}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  );
}

export default function WorkGallery({ items = [], emptyMessage = "New work will be featured here soon." }) {
  const [selected, setSelected] = useState(null);
  const visibleItems = items.filter((item) => (
    item.media_type === "before_after"
      ? safeMediaUrl(item.before_media_url) && safeMediaUrl(item.after_media_url)
      : safeMediaUrl(item.media_url)
  ));

  return (
    <>
      {visibleItems.length ? (
        <div className="gallery-grid">
          {visibleItems.map((item, index) => {
            const mediaUrl = safeMediaUrl(item.media_url);
            return (
              <article className="gallery-item" key={item.id || `${item.title}-${index}`}>
                {item.media_type === "before_after" ? (
                  <BeforeAfterComparison item={item} />
                ) : (
                  <button className="gallery-link" type="button" onClick={() => setSelected(item)} aria-label={`View ${item.title || "gallery item"}`}>
                    <div className="gallery-item-inner">
                      {item.media_type === "video" ? (
                        <video muted loop playsInline preload="metadata">
                          <source src={mediaUrl} />
                        </video>
                      ) : (
                        <img src={mediaUrl} alt={item.alt_text || item.title || "CLEANSMITH service work"} loading="lazy" />
                      )}
                    </div>
                  </button>
                )}
                {item.caption ? <p className="gallery-caption">{item.caption}</p> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="service-page-empty">{emptyMessage}</p>
      )}
      {selected ? (
        <div
          className="lightbox-overlay active"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title || "Gallery media"}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <button className="lightbox-close" type="button" aria-label="Close image" onClick={() => setSelected(null)}>×</button>
          {selected.media_type === "video" ? (
            <video className="lb-media" controls autoPlay playsInline src={safeMediaUrl(selected.media_url)} />
          ) : (
            <img className="lb-media" src={safeMediaUrl(selected.media_url)} alt={selected.alt_text || selected.title || ""} />
          )}
        </div>
      ) : null}
    </>
  );
}
