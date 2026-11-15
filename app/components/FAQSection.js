const faqsByService = {
  "car-wash": [
    {
      question: "Is CLEANSMITH a mobile car wash?",
      answer: "Yes. We come to your home or workplace in Johannesburg and surrounding areas. Contact us to confirm service availability for your location.",
    },
    {
      question: "What car-cleaning services can I request?",
      answer: "You can ask about an exterior wash, full valet, interior deep clean, exterior paint care, or a tailored vehicle detail.",
    },
    {
      question: "How do I get a price for my vehicle?",
      answer: "Tell us your vehicle's make and model and the service you have in mind. We will confirm the scope and price with you.",
    },
    {
      question: "How can I book?",
      answer: "Use the booking form on this page or contact us to request a convenient time.",
    },
  ],
  "home-cleaning": [
    {
      question: "What home-cleaning services are available?",
      answer: "You can request regular home cleaning, deep cleaning, move-in or move-out cleaning, and upholstery or mattress care.",
    },
    {
      question: "How do I get a quote?",
      answer: "Share the size of your home, the rooms or areas that need attention, and your preferred date. We will confirm availability and a tailored quote.",
    },
    {
      question: "Can I ask you to focus on particular areas?",
      answer: "Yes. Tell us which rooms or priority areas matter most, and we will agree the scope with you before the visit.",
    },
    {
      question: "Do you serve my area?",
      answer: "We serve Johannesburg and surrounding areas. Contact us with your location and we will confirm availability.",
    },
  ],
  gardening: [
    {
      question: "What gardening work can I request?",
      answer: "Services include garden maintenance, lawn mowing and edging, hedge and shrub trimming, and seasonal garden clean-ups.",
    },
    {
      question: "Can I book a one-off visit or regular maintenance?",
      answer: "Both are possible. We can discuss the work you need and plan a suitable visit frequency with you.",
    },
    {
      question: "How do I get a gardening quote?",
      answer: "Tell us about your garden, access to the property, and the work you have in mind. We will get back to you with a plan and quote.",
    },
    {
      question: "Is green-waste handling included?",
      answer: "Green-waste handling is agreed in advance as part of the work scope.",
    },
  ],
};

const serviceNames = {
  "car-wash": "Car wash",
  "home-cleaning": "Home cleaning",
  gardening: "Gardening",
};

export default function FAQSection({ service }) {
  const faqs = faqsByService[service] || [];
  if (!faqs.length) return null;

  return (
    <section className="service-page-section faq-section" aria-labelledby={`faq-${service}-heading`}>
      <div className="service-section-inner">
        <p className="service-page-eyebrow">FAQ</p>
        <h2 className="faq-title" id={`faq-${service}-heading`}>
          {serviceNames[service]} FAQs
        </h2>
        <div className="faq-list">
          {faqs.map(({ question, answer }) => (
            <details className="faq-item" key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
