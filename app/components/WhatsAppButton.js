export default function WhatsAppButton() {
  const message = "Hi CLEANSMITH, I found your website and would like help with a booking.";
  return (
    <a
      className="site-whatsapp"
      href={`https://wa.me/27717856901?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with CLEANSMITH on WhatsApp"
    >
      <span aria-hidden="true">✆</span>
      <span>WhatsApp</span>
    </a>
  );
}
