"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback } from "react";
import PoweredBy from "../components/PoweredBy";

export default function AdminDashboard() {
  const initializeAdmin = useCallback(() => {
    if (window.CLEANSMITH_ADMIN_INIT) window.CLEANSMITH_ADMIN_INIT();
  }, []);

  const reportScriptError = useCallback(() => {
    const status = document.getElementById("loginStatus");
    if (status) {
      status.textContent = "The admin script could not be loaded. Refresh the page and try again.";
      status.classList.add("error");
    }
  }, []);

  return (
    <>
      <main id="admin-page" className="admin-page">
        <section id="loginPanel" className="panel auth">
          <p className="muted">CLEANSMITH • ADMIN</p>
          <h1>Sign in to manage your site</h1>
          <p className="muted">Manage service pages, booking add-ons, packages, the About team, VIP plans, and work media.</p>
          <form id="loginForm">
            <label>Email<input name="email" type="email" autoComplete="username" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="btn" type="submit">Sign in</button>
          </form>
          <p className="status" id="loginStatus" role="status" />
        </section>

        <section id="dashboard" hidden>
          <header>
            <div><p className="muted">CLEANSMITH • ADMIN</p><h1>Dashboard</h1><span className="muted" id="userEmail" /></div>
            <div className="top-actions"><Link className="btn secondary" href="/">View website</Link><button className="btn secondary" id="signOut" type="button">Sign out</button></div>
          </header>
          <nav className="toolbar" aria-label="Dashboard sections">
            <button className="tab active" data-tab="packages" type="button">Packages</button>
            <button className="tab" data-tab="pages" type="button">Website pages</button>
            <button className="tab" data-tab="team" type="button">About team</button>
            <button className="tab" data-tab="plans" type="button">Membership plans</button>
            <button className="tab" data-tab="services" type="button">Services</button>
            <button className="tab" data-tab="gallery" type="button">Work gallery</button>
          </nav>
          <p className="status" id="dashboardStatus" role="status" />

          <section className="section" data-section="pages" hidden>
            <h2>Website pages</h2><p className="section-intro">Update the primary hero image and add image or short video slides for each page.</p>
            <div className="layout">
              <div className="panel editor">
                <form id="sitePageForm">
                  <input type="hidden" name="id" />
                  <input type="hidden" name="current_hero_image_url" />
                  <div className="fields">
                    <label>Page<select name="slug" required>
                      <option value="car-wash">Car Wash</option>
                      <option value="home-cleaning">Home Cleaning</option>
                      <option value="gardening">Gardening</option>
                      <option value="sneaker-cleaning">Sneaker Cleaning</option>
                      <option value="about">About Us</option>
                    </select></label>
                    <label className="full">Primary hero image URL<input name="hero_image_url" type="text" inputMode="url" placeholder="https://... or /image.jpg" /><span className="muted">Clear the URL and save to remove this image.</span></label>
                    <label className="full">Or upload a hero image<input name="hero_image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                    <label className="full">Primary hero video URL<input name="hero_video_url" type="text" inputMode="url" placeholder="https://... or /video.mp4" /><span className="muted">Clear the URL and save to remove this video. Videos do not autoplay.</span></label>
                    <label className="full">Or upload a hero video (MP4 or WebM, max 25 MB)<input name="hero_video_file" type="file" accept="video/mp4,video/webm" /></label>
                    <div className="full hero-slides-heading"><strong>Additional hero slides</strong><button className="btn secondary" id="addHeroSlide" type="button">Add slide</button></div>
                    <div className="full hero-slides-list" id="heroSlides" />
                    <span className="full muted">Each slide can use an image or an MP4/WebM video up to 25 MB. Add an image URL to use it as a video poster. Videos do not autoplay and load only when played.</span>
                    <label className="full">Call-to-action text<input name="hero_cta_text" placeholder="Book now or request a quote" /></label>
                  </div>
                  <div className="item-actions"><button className="btn" type="submit">Save page</button><button className="btn secondary" type="reset">Clear</button></div>
                </form>
              </div>
              <div className="items" id="sitePageList" />
            </div>
          </section>

          <section className="section" data-section="team" hidden>
            <h2>About Us team</h2><p className="section-intro">Add team profiles with a photo, name, job title, and short description. Hidden profiles stay in the dashboard but not on the public page.</p>
            <div className="layout">
              <div className="panel editor"><form id="teamForm">
                <input type="hidden" name="id" /><input type="hidden" name="image_url" /><input type="hidden" name="storage_path" />
                <div className="fields">
                  <label>Full name<input name="name" required /></label>
                  <label>Job title<input name="role" placeholder="Detailing specialist" /></label>
                  <label className="full">Description<textarea name="description" rows={4} /></label>
                  <label className="full">Team photo<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                  <label>Display order<input name="sort_order" type="number" defaultValue="0" /></label>
                  <label>Visible<select name="is_active"><option value="true">Yes</option><option value="false">No</option></select></label>
                </div>
                <div className="item-actions"><button className="btn" type="submit">Save team member</button><button className="btn secondary" type="reset">Clear</button></div>
              </form></div>
              <div className="items" id="teamList" />
            </div>
          </section>

          <section className="section" data-section="packages">
            <h2>Service packages</h2><p className="section-intro">Manage packages by service page. Car-wash packages can also have prices by vehicle size.</p>
            <div className="layout">
              <div className="panel editor">
                <form id="packageForm">
                  <input type="hidden" name="id" />
                  <div className="fields">
                    <label className="full">Service page<select name="service_slug" required>
                      <option value="car-wash">Car wash</option>
                      <option value="home-cleaning">Home cleaning</option>
                      <option value="gardening">Gardening</option>
                      <option value="sneaker-cleaning">Sneaker Cleaning</option>
                    </select></label>
                    <label>Package name<input name="name" required /></label>
                    <label>URL slug<input name="slug" pattern="[a-z0-9-]+" required /></label>
                    <label>Starting price (R)<input name="starting_price" type="number" min="0" required /></label>
                    <label>Price unit<input name="price_unit" defaultValue="session" required /></label>
                    <label>Duration<input name="duration" placeholder="45–60 minutes" /></label>
                    <label>Badge<input name="badge" /></label>
                    <label>Card style<select name="style"><option value="standard">Standard</option><option value="featured">Featured</option><option value="executive">Executive</option></select></label>
                    <label className="full">Description<textarea name="description" /></label>
                    <label className="full">Features (one per line)<textarea name="features" /></label>
                    <div className="full fields vehicle-price-fields" data-car-price-fields>
                      <label>Hatchback price<input name="price_hatch" type="number" min="0" /></label>
                      <label>Sedan price<input name="price_sedan" type="number" min="0" /></label>
                      <label>SUV / Bakkie price<input name="price_suv" type="number" min="0" /></label>
                      <label>Luxury / Sports price<input name="price_luxury" type="number" min="0" /></label>
                      <label>Minibus / Van price<input name="price_minibus" type="number" min="0" /></label>
                    </div>
                    <label>Display order<input name="sort_order" type="number" defaultValue="0" /></label>
                    <label>Visible<select name="is_active"><option value="true">Yes</option><option value="false">No</option></select></label>
                  </div>
                  <div className="item-actions"><button className="btn" type="submit">Save package</button><button className="btn secondary" type="reset">Clear</button></div>
                </form>
              </div>
              <div className="items" id="packageList" />
            </div>
          </section>

          <section className="section" data-section="plans" hidden>
            <h2>Membership plans</h2><p className="section-intro">Edit the VIP plans shown on the landing page.</p>
            <div className="layout">
              <div className="panel editor"><form id="planForm">
                <input type="hidden" name="id" /><div className="fields">
                  <label>Plan name<input name="name" required /></label><label>Price (R)<input name="price" type="number" min="0" required /></label>
                  <label>Billing interval<input name="billing_interval" defaultValue="month" required /></label><label>Discount (%)<input name="discount_percent" type="number" min="0" max="100" defaultValue="0" /></label>
                  <label>Badge<input name="badge" /></label><label>Display order<input name="sort_order" type="number" defaultValue="0" /></label>
                  <label className="full">Benefits (one per line)<textarea name="benefits" /></label>
                  <label>Visible<select name="is_active"><option value="true">Yes</option><option value="false">No</option></select></label>
                </div><div className="item-actions"><button className="btn" type="submit">Save plan</button><button className="btn secondary" type="reset">Clear</button></div>
              </form></div>
              <div className="items" id="planList" />
            </div>
          </section>

          <section className="section" data-section="services" hidden>
            <h2>Services</h2><p className="section-intro">Manage the service cards published on each page and the optional add-ons customers can select when booking.</p>
            <h3 className="subsection-title">Website service cards</h3>
            <p className="section-intro">Edit each card separately so its title, description, image, price label, and features display in their own fields on the published page.</p>
            <div className="layout service-editor-layout">
              <div className="panel editor"><form id="pageServiceForm">
                <input type="hidden" name="service_index" /><input type="hidden" name="storage_path" />
                <div className="fields">
                  <label className="full">Website page<select name="page_slug" required>
                    <option value="car-wash">Car wash</option>
                    <option value="home-cleaning">Home cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="sneaker-cleaning">Sneaker Cleaning</option>
                  </select></label>
                  <label className="full">Service title<input name="title" required /></label>
                  <label className="full">Description<textarea name="description" rows={4} /></label>
                  <label>Price or quote label<input name="price_label" placeholder="Request a quote" /></label>
                  <label>Service image URL<input name="image_url" type="text" inputMode="url" placeholder="https://... or /image.jpg" /><span className="muted">Clear the URL and save to remove the image.</span></label>
                  <label className="full">Or upload a service image<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                  <label className="full">Features (one per line)<textarea name="features" rows={4} /></label>
                </div>
                <div className="item-actions"><button className="btn" type="submit">Save service card</button><button className="btn secondary" type="reset">Clear</button></div>
              </form></div>
              <div className="items" id="pageServiceList" />
            </div>
            <h3 className="subsection-title">Booking add-ons</h3>
            <p className="section-intro">Active add-ons appear in the car-wash booking form and are included in the estimate.</p>
            <div className="layout">
              <div className="panel editor"><form id="bookingAddonForm">
                <input type="hidden" name="id" /><div className="fields">
                  <label>Service name<input name="name" required /></label>
                  <label>Service slug<input name="slug" pattern="[a-z0-9_-]+" required /><span className="muted">Use lowercase letters, numbers, hyphens, or underscores.</span></label>
                  <label>Price (R)<input name="price" type="number" min="0" required /></label>
                  <label>Display order<input name="sort_order" type="number" defaultValue="0" /></label>
                  <label>Visible<select name="is_active"><option value="true">Yes</option><option value="false">No</option></select></label>
                </div><div className="item-actions"><button className="btn" type="submit">Save booking add-on</button><button className="btn secondary" type="reset">Clear</button></div>
              </form></div>
              <div className="items" id="bookingAddonList" />
            </div>
          </section>

          <section className="section" data-section="gallery" hidden>
            <h2>Work gallery</h2><p className="section-intro">Add images, videos, or an interactive before-and-after pair to any service gallery.</p>
            <div className="layout">
              <div className="panel editor"><form id="galleryForm">
                <input type="hidden" name="id" /><input type="hidden" name="storage_path" /><input type="hidden" name="media_url" />
                <input type="hidden" name="before_media_url" /><input type="hidden" name="after_media_url" />
                <input type="hidden" name="before_storage_path" /><input type="hidden" name="after_storage_path" />
                <div className="fields">
                  <label className="full">Service<select name="service_slug" required>
                    <option value="car-wash">Car wash</option>
                    <option value="home-cleaning">Home cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="sneaker-cleaning">Sneaker Cleaning</option>
                  </select></label>
                  <label className="full">Title<input name="title" required /></label><label className="full">Caption<input name="caption" /></label>
                  <label>Gallery type<select name="media_type">
                    <option value="image">Single image</option>
                    <option value="video">Video</option>
                    <option value="before_after">Before &amp; after</option>
                  </select></label>
                  <label className="full" data-gallery-single-file>Image/video file<input name="media_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" /></label>
                  <label className="full" data-gallery-before-file hidden>Before image<input name="before_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                  <label className="full" data-gallery-after-file hidden>After image<input name="after_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                  <label className="full">Alt text<input name="alt_text" /></label><label>Display order<input name="sort_order" type="number" defaultValue="0" /></label>
                  <label>Published<select name="is_published"><option value="true">Yes</option><option value="false">No</option></select></label>
                </div><div className="item-actions"><button className="btn" type="submit">Save work</button><button className="btn secondary" type="reset">Clear</button></div>
              </form></div>
              <div className="items" id="galleryList" />
            </div>
          </section>
        </section>
      </main>
      <footer className="admin-attribution"><PoweredBy /></footer>
      <Script src="/admin.js" strategy="afterInteractive" onReady={initializeAdmin} onError={reportScriptError} />
    </>
  );
}
