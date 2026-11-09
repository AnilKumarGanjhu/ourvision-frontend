import React from "react";
import "./DashboardCommunityPhotos.css";

const photoRoot = "/our-vision-photos/";

const initiatives = [
  {
    image: "01_financial_support_seedling.png",
    title: "Financial Support",
    description: "Helping ideas and communities grow.",
  },
  {
    image: "02_social_service_donation.png",
    title: "Social Service & Donation",
    description: "Sharing support with people who need it.",
  },
  {
    image: "03_community_cooperation_hands.png",
    title: "Community Cooperation",
    description: "Stronger together through shared effort.",
  },
];

const values = [
  {
    image: "05_community_togetherness.png",
    title: "Community Cooperation",
    description: "Encouraging mutual support and collective progress.",
  },
  {
    image: "04_transparency_and_trust.png",
    title: "Transparency & Trust",
    description: "Handling contributions and deposits responsibly.",
  },
  {
    image: "06_fairness_handshake.png",
    title: "Fairness & Accountability",
    description: "Treating members with respect and clear processes.",
  },
  {
    image: "07_sustainable_opportunity_farmer.png",
    title: "Sustainable Opportunity",
    description: "Supporting social welfare, livelihoods, and entrepreneurship.",
  },
];

function PhotoCard({ item, value = false }) {
  return (
    <article className={`dashboard-photo-card${value ? " is-value" : ""}`}>
      <img src={`${photoRoot}${item.image}`} alt={item.title} loading="lazy" />
      <div className="dashboard-photo-card-copy">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

export default function DashboardCommunityPhotos() {
  return (
    <section className="dashboard-community-photos" aria-label="Our community and values">
      <div className="dashboard-community-heading">
        <span>OUR COMMUNITY</span>
        <h2>Growing stronger together</h2>
        <p>Financial support, social service and cooperation help our community move forward.</p>
      </div>
      <div className="dashboard-initiative-grid">
        {initiatives.map((item) => <PhotoCard key={item.image} item={item} />)}
      </div>
      <div className="dashboard-community-heading dashboard-values-heading">
        <span>WHAT WE BELIEVE IN</span>
        <h2>Our Values</h2>
        <p>Responsible progress starts with trust, respect, and a shared commitment to doing things the right way.</p>
      </div>
      <div className="dashboard-values-grid">
        {values.map((item) => <PhotoCard key={item.image} item={item} value />)}
      </div>
    </section>
  );
}
