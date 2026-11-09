import React, { useEffect, useRef, useState } from "react";
import {
  FaUsers,
  FaHandHoldingHeart,
  FaPiggyBank,
  FaStore,
  FaArrowRight,
  FaCheckCircle,
  FaHandshake,
  FaShieldAlt,
  FaChartLine,
  FaHeart,
  FaLightbulb,
} from "react-icons/fa";

import "./About.css";

const stats = [
  { target: 500, label: "Community Members", icon: <FaUsers />, color: "green" },
  { target: 150, label: "Supported Families", icon: <FaHandHoldingHeart />, color: "blue" },
  { target: 75, label: "Financial Assistance", icon: <FaPiggyBank />, color: "mixed" },
  { target: 25, label: "Business Initiatives", icon: <FaStore />, color: "gradient" },
];

const purposes = [
  {
    number: "01",
    icon: <FaPiggyBank />,
    title: "Financial Support",
    subtitle: "RMD Scheme & Loan Assistance",
    text: "The Regular Monthly Deposit (RMD) scheme encourages regular savings and helps build a shared financial-support base for eligible members. Subject to organisational rules, available funds, and approval, members may be considered for loan assistance when important needs arise.",
  },
  {
    number: "02",
    icon: <FaHeart />,
    title: "Social Service",
    subtitle: "Mission Donation",
    text: "We aim to support people and communities through voluntary donations and community initiatives. Depending on available resources, efforts may include education, health, environmental activities, essential supplies, and other community needs.",
  },
  {
    number: "03",
    icon: <FaChartLine />,
    title: "Business & Entrepreneurship",
    subtitle: "Building Shared Opportunities",
    text: "We encourage collective business initiatives, entrepreneurship, and skill development that can help members create livelihoods and strengthen financial resilience. Business activities should be planned transparently, with responsibilities and risks clearly understood.",
  },
];

const values = [
  {
    icon: <FaHandshake />,
    title: "Community Cooperation",
    text: "Encouraging mutual support and collective progress.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Transparency & Trust",
    text: "Handling contributions and deposits responsibly.",
  },
  {
    icon: <FaCheckCircle />,
    title: "Fairness & Accountability",
    text: "Treating members with respect and clear processes.",
  },
  {
    icon: <FaLightbulb />,
    title: "Sustainable Opportunity",
    text: "Supporting social welfare, livelihoods, and entrepreneurship.",
  },
];

export default function AboutUs() {
  const statsRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const section = statsRef.current;
    if (!section || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const duration = 1500;
    const startTime = performance.now();
    let frameId;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts(
        stats.map((item) => Math.round(item.target * eased))
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [started]);

  return (
    <main className="ov-about">
      {/* Hero Section */}
      <section className="ov-hero">
        <div className="ov-hero-pattern" aria-hidden="true" />

        <div className="ov-container ov-hero-content">
          <div className="ov-eyebrow">
            <span />
            OUR VISION RANCHI
          </div>

          <h1>
            Together for a <em>Better Tomorrow.</em>
          </h1>

          <p className="ov-hero-copy">
            Building stronger communities through financial cooperation,
            social responsibility, and shared opportunities.
          </p>

          <a className="ov-primary-button" href="#our-purpose">
            Discover Our Purpose <FaArrowRight />
          </a>

          <div className="ov-hero-note">
            <span className="ov-note-icon">
              <FaUsers />
            </span>
            <span>
              <strong>Community first</strong>
              <small>Progress through collective effort</small>
            </span>
          </div>
        </div>

        <div className="ov-hero-orb ov-orb-one" />
        <div className="ov-hero-orb ov-orb-two" />
      </section>

      {/* Who We Are */}
      <section className="ov-intro ov-section">
        <div className="ov-container ov-intro-grid">
          <div className="ov-intro-heading">
            <div className="ov-section-label">WHO WE ARE</div>
            <h2>
              A community that moves <span>forward together.</span>
            </h2>
          </div>

          <div className="ov-intro-copy">
            <p>
              Our Vision Ranchi is a community-focused initiative built around
              mutual support, social responsibility, and collective progress.
              Our aim is to help members strengthen their financial stability,
              support people in need, and encourage sustainable business and
              entrepreneurship.
            </p>

            <div className="ov-intro-signoff">
              <span />
              Shared purpose. Meaningful progress.
            </div>
          </div>
        </div>
      </section>

      {/* Our Purpose */}
      <section className="ov-purpose ov-section" id="our-purpose">
        <div className="ov-container">
          <div className="ov-section-heading">
            <div className="ov-section-label">WHAT DRIVES US</div>
            <h2>Our Purpose</h2>
            <p>
              Three focus areas that help turn collective intent into
              practical action.
            </p>
          </div>

          <div className="ov-purpose-grid">
            {purposes.map((item) => (
              <article className="ov-purpose-card" key={item.number}>
                <div className="ov-purpose-top">
                  <span className="ov-purpose-icon">{item.icon}</span>
                  <span className="ov-purpose-number">{item.number}</span>
                </div>

                <h3>{item.title}</h3>
                <h4>{item.subtitle}</h4>
                <p>{item.text}</p>
                <div className="ov-card-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="ov-stats ov-section" ref={statsRef}>
        <div className="ov-container">
          <div className="ov-stats-heading">
            <div>
              <div className="ov-section-label">OUR GROWING IMPACT</div>
              <h2>
                Small steps. <span>Stronger communities.</span>
              </h2>
            </div>

            <p>
              Every effort counts when we work together towards a more
              supportive future.
            </p>
          </div>

          <div className="ov-stats-grid">
            {stats.map((item, index) => (
              <article className="ov-stat-card" key={item.label}>
                <div className={`ov-stat-icon ${item.color}`}>
                  {item.icon}
                </div>

                <div className="ov-stat-number">
                  {counts[index]}
                  <span>+</span>
                </div>

                <div className="ov-stat-label">{item.label}</div>
              </article>
            ))}
          </div>

          <p className="ov-stats-disclaimer">
            * Verify these figures against your organisation's current
            records before publishing.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="ov-values ov-section">
        <div className="ov-container ov-values-grid">
          <div className="ov-values-intro">
            <div className="ov-section-label">WHAT WE BELIEVE IN</div>
            <h2>Our Values</h2>
            <p>
              Responsible progress starts with trust, respect, and a shared
              commitment to doing things the right way.
            </p>
          </div>

          <div className="ov-values-list">
            {values.map((value) => (
              <div className="ov-value-item" key={value.title}>
                <span className="ov-value-icon">{value.icon}</span>
                <div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="ov-working ov-section">
        <div className="ov-container">
          <div className="ov-section-heading">
            <div className="ov-section-label">OUR APPROACH</div>
            <h2>How We Aim to Work</h2>
            <p>
              Clear processes help protect members and strengthen community
              trust.
            </p>
          </div>

          <div className="ov-working-grid">
            <div className="ov-working-item">
              <span>01</span>
              <p>
                Keep programme rules and eligibility requirements clear to
                members.
              </p>
            </div>

            <div className="ov-working-item">
              <span>02</span>
              <p>
                Maintain appropriate records for deposits, donations, loans,
                and repayments.
              </p>
            </div>

            <div className="ov-working-item">
              <span>03</span>
              <p>
                Use an approval process before committing organisation funds.
              </p>
            </div>

            <div className="ov-working-item">
              <span>04</span>
              <p>
                Protect member information and handle documents responsibly.
              </p>
            </div>

            <div className="ov-working-item">
              <span>05</span>
              <p>
                Share updates on approved activities and the use of funds
                where appropriate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="ov-commitment">
        <div className="ov-container ov-commitment-inner">
          <div className="ov-commitment-mark">
            <FaHandHoldingHeart />
          </div>

          <div>
            <div className="ov-section-label">OUR COMMITMENT</div>
            <h2>
              Better futures are built <span>together.</span>
            </h2>

            <p>
              Our Vision Ranchi seeks to bring people together through
              financial cooperation, social service, and shared opportunity.
              By working collectively and responsibly, we aim to contribute
              to a stronger, healthier, and more supportive community.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}