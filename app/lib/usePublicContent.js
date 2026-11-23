"use client";

import { useEffect, useState } from "react";
import {
  fallbackWorkGallery,
  fallbackBookingAddons,
  fallbackMemberships,
  fallbackPackages,
  fallbackPages,
} from "./site-content";

export default function usePublicContent() {
  const [packages, setPackages] = useState(fallbackPackages);
  const [memberships, setMemberships] = useState(fallbackMemberships);
  const [bookingAddons, setBookingAddons] = useState(fallbackBookingAddons);
  const [pages, setPages] = useState(fallbackPages);
  const [gallery, setGallery] = useState(fallbackWorkGallery);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const config = window.CLEANSMITH_SUPABASE_CONFIG;
    if (!config || !window.supabase || !window.supabase.createClient) return;
    if (!config.url || !config.anonKey) return;

    const client = window.CLEANSMITH_SUPABASE_CLIENT ||
      (window.CLEANSMITH_SUPABASE_CLIENT = window.supabase.createClient(config.url, config.anonKey));

    function load(query, label, update, replaceWhenEmpty = false) {
      query.then(({ data, error }) => {
        if (error) {
          console.error(`Unable to load CLEANSMITH ${label}:`, error);
          return;
        }
        if (Array.isArray(data) && (data.length || replaceWhenEmpty)) update(data);
      }).catch((error) => {
        console.error(`Unable to load CLEANSMITH ${label}:`, error);
      });
    }

    function mergeGallery(rows) {
      const categories = new Set(rows.map((item) => item.service_slug || "car-wash"));
      const missingCategorySamples = fallbackWorkGallery.filter((item) => !categories.has(item.service_slug));
      setGallery([...rows, ...missingCategorySamples]);
    }

    function mergePages(rows) {
      setPages((current) => {
        const next = { ...current };
        rows.forEach((page) => {
          const fallback = fallbackPages[page.slug];
          if (!fallback) {
            next[page.slug] = page;
            return;
          }

          const merged = { ...fallback, ...page };
          ["hero_title", "hero_subtitle", "intro", "section_title", "callout_title", "callout_text"]
            .forEach((field) => {
              if (!String(merged[field] || "").trim()) merged[field] = fallback[field];
            });
          if (!Array.isArray(merged.services)) {
            merged.services = fallback.services;
          } else if (page.slug === "car-wash") {
            const exteriorImage = merged.services.find((service) => service.title === "Exterior Car Wash")?.image_url;
            merged.services = merged.services.map((service) => {
              const normalized = { ...service };
              if (normalized.price_label === "Ask us for a quote") {
                const prices = {
                  "Exterior Car Wash": "From R250",
                  "Full Valet": "From R500",
                  "Interior Deep Clean": "From R200",
                };
                normalized.price_label = prices[normalized.title] || "Price confirmed for your vehicle";
              }
              if (normalized.title === "Vehicle Detailing" && normalized.image_url === exteriorImage) {
                normalized.image_url = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=960&q=80";
              }
              return normalized;
            });
          }
          next[page.slug] = merged;
        });
        return next;
      });
    }

    load(client.from("packages").select("*").order("sort_order"), "packages", setPackages);
    load(client.from("membership_plans").select("*").order("sort_order"), "membership plans", setMemberships);
    load(
      client.from("booking_addons").select("slug, name, price").eq("is_active", true).order("sort_order"),
      "booking add-on services",
      setBookingAddons,
      true,
    );
    load(
      client.from("site_pages").select("*").order("sort_order"),
      "service page content",
      mergePages,
    );
    load(
      client.from("work_gallery").select("*").eq("is_published", true).order("sort_order"),
      "work gallery",
      mergeGallery,
      true,
    );
    load(
      client.from("team_members").select("*").eq("is_active", true).order("sort_order"),
      "team members",
      setTeamMembers,
      true,
    );
  }, []);

  return { packages, memberships, bookingAddons, pages, gallery, teamMembers };
}
