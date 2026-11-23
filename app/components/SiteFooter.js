import Link from "next/link";
import PoweredBy from "./PoweredBy";

export default function SiteFooter() {
  return (
    <footer className="service-footer">
      <Link href="/">CLEANSMITH · Johannesburg</Link>
      <Link href="/about">Our story</Link>
      <Link href="/sneaker-cleaning">Sneaker cleaning</Link>
      <a href="mailto:info@cleansmith.co.za">Contact us</a>
      <Link href="/terms">Terms</Link>
      <Link href="/privacy">Privacy</Link>
      <span>Operating hours: Daily, 07:00–17:00</span>
      <span>Cancellations: Please contact us as early as possible. Final price confirmed before work starts; payment details confirmed when booking.</span>
      <span>© {new Date().getFullYear()} CLEANSMITH. All rights reserved.</span>
      <PoweredBy />
    </footer>
  );
}
