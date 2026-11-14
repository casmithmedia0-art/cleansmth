import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="service-footer">
      <Link href="/">CLEANSMITH · Johannesburg</Link>
      <Link href="/about">Our story</Link>
      <a href="https://cleansmith.revue.us/reviews" target="_blank" rel="noopener noreferrer">Read our Google reviews</a>
      <a href="mailto:info@cleansmith.co.za">Contact us</a>
    </footer>
  );
}
