"use client";

import { useEffect, useState } from "react";

const reviewsUrl = "https://cleansmith.revue.us/reviews";
const fallbackReviews = [
  {
    id: "barry-buzz-venter",
    author: "Barry Buzz Venter",
    text: "Excellent Work, Wow! My car is an old girl, but shes never looked this good! Thank You Caleb",
    date: "2026-11-13",
    rating: 5,
  },
  {
    id: "joe-kwarteng",
    author: "Joe Kwarteng",
    text: "Very hard working guys I enjoyed their service keep it up",
    date: "2026-10-11",
    rating: 5,
  },
  {
    id: "marius-brits",
    author: "Marius Brits",
    text: "Great Service! Very happy with the car wash they do every two weeks for us!",
    date: "2026-08-03",
    rating: 5,
  },
];

function isLocalBusiness(value) {
  if (!value || typeof value !== "object") return false;
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  return types.indexOf("LocalBusiness") !== -1 && Boolean(value.aggregateRating);
}

function getReviewData(html) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const schemaNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((script) => {
      try {
        return JSON.parse(script.textContent || "");
      } catch {
        return null;
      }
    })
    .flatMap((data) => (Array.isArray(data) ? data : data ? [data] : []))
    .flatMap((data) => (Array.isArray(data["@graph"]) ? data["@graph"] : [data]));
  const business = schemaNodes.find(isLocalBusiness);

  if (!business) {
    throw new Error("The reviews page did not include Google review data.");
  }

  const sourceReviews = Array.isArray(business.review)
    ? business.review
    : business.review
      ? [business.review]
      : [];
  const reviews = sourceReviews
    .filter((review) => review && typeof review === "object")
    .map((review, index) => {
      const author = review.author;
      const sourceRating = review.reviewRating && review.reviewRating.ratingValue;
      const ratingValue = sourceRating == null ? Number.NaN : Number(sourceRating);
      return {
        id: `${author && author.name ? author.name : "review"}-${review.datePublished || ""}-${index}`,
        author: typeof author === "string" ? author : author && author.name ? author.name : "Google reviewer",
        text: String(review.reviewBody || "").trim(),
        date: String(review.datePublished || ""),
        rating: Number.isFinite(ratingValue) ? ratingValue : null,
      };
    })
    .filter((review) => review.text);

  const ratingValue = business.aggregateRating.ratingValue;
  const reviewCount = Number(business.aggregateRating.reviewCount);
  return {
    rating: ratingValue == null ? null : Number(ratingValue),
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : reviews.length,
    reviews,
  };
}

function formatStars(value) {
  const filled = Number.isFinite(value) ? Math.max(0, Math.min(5, Math.round(value))) : 0;
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

function ReviewCard({ review }) {
  return (
    <article className="google-review-card">
      <header className="google-review-header">
        <div>
          <h3>{review.author}</h3>
          {review.date ? <time dateTime={review.date}>{formatDate(review.date)}</time> : null}
        </div>
        <span className="google-review-stars" role="img" aria-label={review.rating == null ? "Google review" : `${review.rating} out of 5 stars`}>
          {formatStars(review.rating)}
        </span>
      </header>
      <p>{review.text}</p>
      <span className="google-review-source">Google review</span>
    </article>
  );
}

export default function GoogleReviews() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const response = await fetch(reviewsUrl, {
          signal: controller.signal,
          headers: { Accept: "text/html" },
        });
        if (!response.ok) {
          throw new Error(`The reviews service responded with ${response.status}.`);
        }
        setData(getReviewData(await response.text()));
      } catch (loadError) {
        if (loadError.name === "AbortError") return;
        console.error("Unable to load CLEANSMITH Google reviews:", loadError);
        setError("Google reviews are temporarily unavailable.");
      }
    }

    loadReviews();
    return () => controller.abort();
  }, []);

  if (error || !data) {
    return (
      <div className="google-reviews-feed">
        <p className="google-reviews-status" role="status">
          {error ? "Recent Google reviews" : "Recent customer reviews"}
        </p>
        <div className="google-review-grid">
          {fallbackReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="google-reviews-feed" aria-live="polite">
      <div className="google-reviews-summary">
        <strong>{Number.isFinite(data.rating) ? data.rating.toFixed(1) : "—"}</strong>
        <div>
          <span className="google-review-stars" role="img" aria-label={data.rating == null ? "Google rating" : `${data.rating} out of 5 stars`}>
            {formatStars(data.rating)}
          </span>
          <p>{data.reviewCount} Google reviews · Updated daily</p>
        </div>
      </div>
      {data.reviews.length ? (
        <div className="google-review-grid">
          {data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        <div className="google-review-grid">
          {fallbackReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      )}
    </div>
  );
}
