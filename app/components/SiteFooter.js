import Link from "next/link";
import PoweredBy from "./PoweredBy";

export default function SiteFooter() {
  return (
    <footer className="service-footer">
      <Link href="/">CLEANSMITH · Johannesburg</Link>
      <Link href="/about">Our story</Link>
      <a href="mailto:info@cleansmith.co.za">Contact us</a>
      <PoweredBy />
    </footer>
  );
}
