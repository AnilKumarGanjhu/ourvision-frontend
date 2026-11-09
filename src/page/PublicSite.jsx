import React, { useState } from "react";
import {
  ArrowRight,
  HeartHandshake,
  Users,
  HandCoins,
  CalendarDays,
  LogIn,
  Sparkles,
  Lightbulb,
  Images,
} from "lucide-react";

import About from "./About";
import ContactUs from "./ContactUs";
import BusinessIdea from "../components/BusinessIdeas";

import "./PublicSite.css";

const publicPages = [
  "Home",
  "Business Idea",
  "About Us",
  "Contact Us",
];

export default function PublicSite({ onLogin }) {
  const [page, setPage] = useState("Home");

  const navigate = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="public-site">
      <header className="public-header">
        <button
          className="public-brand"
          type="button"
          onClick={() => navigate("Home")}
          aria-label="Our Vision home"
        >
          <img src="/golden-ov-logo.png" alt="Our Vision logo" />
          <span>
            <strong>OUR VISION</strong>
            <small>Together We Grow</small>
          </span>
        </button>

        <nav className="public-nav" aria-label="Public navigation">
          {publicPages.map((item) => (
            <button
              type="button"
              key={item}
              className={page === item ? "active" : ""}
              aria-current={page === item ? "page" : undefined}
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="public-login-btn"
          onClick={onLogin}
        >
          <LogIn size={17} />
          Login
        </button>
      </header>

      <main className="public-main">
        {page === "Home" && (
          <>
            <section className="public-hero">
              <div className="public-hero-copy">
                <span className="public-eyebrow">
                  <Sparkles size={15} />
                  COMMUNITY • PURPOSE • PROGRESS
                </span>

                <h1>
                  Better together.
                  <br />
                  <em>Stronger tomorrow.</em>
                </h1>

                <p>
                  Our Vision brings people together to share ideas, support
                  community initiatives, and create meaningful impact through
                  collaboration and contribution.
                </p>

                <div className="public-hero-actions">
                  <button
                    type="button"
                    className="public-primary-btn"
                    onClick={() => navigate("About Us")}
                  >
                    Discover Our Vision <ArrowRight size={17} />
                  </button>

                  <button
                    type="button"
                    className="public-secondary-btn"
                    onClick={() => navigate("Contact Us")}
                  >
                    Contact Us
                  </button>
                </div>
              </div>

              <div className="public-hero-art" aria-hidden="true">
                <div className="public-orbit public-orbit-one" />
                <div className="public-orbit public-orbit-two" />

                <div className="public-hero-emblem">
                  <img src="/golden-ov-logo.png" alt="" />
                </div>

                <div className="public-floating-card public-floating-top">
                  <Users size={20} />
                  <span>
                    <b>One community</b>
                    <small>Connected by purpose</small>
                  </span>
                </div>

                <div className="public-floating-card public-floating-bottom">
                  <HeartHandshake size={20} />
                  <span>
                    <b>Shared impact</b>
                    <small>Growing together</small>
                  </span>
                </div>
              </div>
            </section>

            <section className="public-photo-highlights" aria-label="Our community initiatives">
              <article className="public-photo-highlight">
                <img src="/our-vision-photos/01_financial_support_seedling.png" alt="Hands nurturing a young seedling" loading="lazy" />
                <div className="public-photo-caption"><span>Financial Support</span><p>Helping ideas and communities grow.</p></div>
              </article>
              <article className="public-photo-highlight">
                <img src="/our-vision-photos/02_social_service_donation.png" alt="Volunteer supporting an elderly community member" loading="lazy" />
                <div className="public-photo-caption"><span>Social Service & Donation</span><p>Sharing support with people who need it.</p></div>
              </article>
              <article className="public-photo-highlight">
                <img src="/our-vision-photos/03_community_cooperation_hands.png" alt="People joining hands in cooperation" loading="lazy" />
                <div className="public-photo-caption"><span>Community Cooperation</span><p>Stronger together through shared effort.</p></div>
              </article>
            </section>

            <section className="public-values-section">
              <div className="public-section-heading">
                <span>WHAT BRINGS US TOGETHER</span>
                <h2>Small actions. Lasting impact.</h2>
                <p>
                  A community grows stronger when members share their time,
                  skills and support.
                </p>
              </div>

              <div className="public-value-grid">
                <article className="public-value-card">
                  <span className="public-value-icon">
                    <Users size={22} />
                  </span>
                  <h3>Community</h3>
                  <p>
                    Build relationships, share experiences and support one
                    another.
                  </p>
                </article>

                <article className="public-value-card">
                  <span className="public-value-icon">
                    <HandCoins size={22} />
                  </span>
                  <h3>Contribution</h3>
                  <p>
                    Bring resources together to help turn shared goals into
                    action.
                  </p>
                </article>

                <article className="public-value-card">
                  <span className="public-value-icon">
                    <CalendarDays size={22} />
                  </span>
                  <h3>Participation</h3>
                  <p>
                    Stay connected through meetings, programs and community
                    events.
                  </p>
                </article>
              </div>
            </section>

            <section className="public-beliefs-section">
              <div className="public-section-heading">
                <span>WHAT WE BELIEVE IN</span>
                <h2>Our Values</h2>
                <p>Responsible progress starts with trust, respect, and a shared commitment to doing things the right way.</p>
              </div>
              <div className="public-beliefs-grid">
                <article className="public-belief-card">
                  <img src="/our-vision-photos/05_community_togetherness.png" alt="Community members standing together" loading="lazy" />
                  <div><h3>Community Cooperation</h3><p>Encouraging mutual support and collective progress.</p></div>
                </article>
                <article className="public-belief-card">
                  <img src="/our-vision-photos/04_transparency_and_trust.png" alt="A hand protecting symbols of trust and responsibility" loading="lazy" />
                  <div><h3>Transparency & Trust</h3><p>Handling contributions and deposits responsibly.</p></div>
                </article>
                <article className="public-belief-card">
                  <img src="/our-vision-photos/06_fairness_handshake.png" alt="A professional handshake representing fairness" loading="lazy" />
                  <div><h3>Fairness & Accountability</h3><p>Treating members with respect and clear processes.</p></div>
                </article>
                <article className="public-belief-card">
                  <img src="/our-vision-photos/07_sustainable_opportunity_farmer.png" alt="Farmer using technology in a green field" loading="lazy" />
                  <div><h3>Sustainable Opportunity</h3><p>Supporting social welfare, livelihoods, and entrepreneurship.</p></div>
                </article>
              </div>
            </section>

            <section className="public-explore-section">
              <div className="public-section-heading">
                <span>EXPLORE OUR VISION</span>
                <h2>Discover ideas and community moments.</h2>
                <p>
                  Explore business ideas, activities, events and memories
                  from our community.
                </p>
              </div>

              <div className="public-explore-grid">
                <article className="public-explore-card">
                  <span className="public-value-icon">
                    <Lightbulb size={22} />
                  </span>
                  <h3>Business Ideas</h3>
                  <p>
                    Explore ideas and opportunities shared with the community.
                  </p>
                  <button
                    type="button"
                    className="public-text-btn"
                    onClick={() => navigate("Business Idea")}
                  >
                    Explore ideas <ArrowRight size={16} />
                  </button>
                </article>

                <article className="public-explore-card">
                  <span className="public-value-icon">
                    <Images size={22} />
                  </span>
                  <h3>Gallery & Events</h3>
                  <p>
                    Discover community activities, event highlights and
                    photographs.
                  </p>
                  <button
                    type="button"
                    className="public-text-btn"
                    onClick={() => navigate("Gallery & Events")}
                  >
                    View gallery <ArrowRight size={16} />
                  </button>
                </article>
              </div>
            </section>

            <section className="public-join-strip">
              <div>
                <h2>Interested in becoming a member?</h2>
                <p>
                  For a new account, please contact the Our Vision
                  administrator.
                </p>
              </div>

              <button
                type="button"
                className="public-secondary-btn"
                onClick={() => navigate("Contact Us")}
              >
                Get in touch <ArrowRight size={16} />
              </button>
            </section>
          </>
        )}

        {page === "About Us" && (
          <div className="public-inner-page">
            <About />
          </div>
        )}

        {page === "Business Idea" && (
          <div className="public-inner-page">
            <BusinessIdea />
          </div>
        )}

        {page === "Contact Us" && (
          <div className="public-contact-page">
            <ContactUs />
          </div>
        )}
      </main>
    </div>
  );
}