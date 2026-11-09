
import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <a href="/" className="legal-back-link">
          ← Back to Home
        </a>

        <header className="legal-header">
          <span className="legal-eyebrow">OUR VISION</span>
          <h1>Privacy Policy</h1>
          <p>
            Your privacy matters to us. This policy explains how Our Vision
            collects, uses and protects your information.
          </p>
        </header>

        <p className="legal-updated">
          Last updated: October 2026
        </p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Our Vision is committed to protecting the privacy of its members,
            visitors, volunteers and supporters. This Privacy Policy describes
            how information may be collected and handled when you use our
            website and services.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>Depending on how you use our services, we may collect:</p>
          <ul>
            <li>Personal details such as name, email address and phone number.</li>
            <li>Member profile details that you choose to provide.</li>
            <li>Contribution, attendance and membership records where applicable.</li>
            <li>Technical information needed to operate and secure the website.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Information</h2>
          <p>Information may be used to:</p>
          <ul>
            <li>Manage membership and member profiles.</li>
            <li>Maintain contribution and attendance records.</li>
            <li>Communicate important organisational updates.</li>
            <li>Improve website functionality and security.</li>
            <li>Meet applicable legal or administrative obligations.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Information Sharing</h2>
          <p>
            We do not intend to sell personal information. Information may be
            accessed by authorised personnel or shared with service providers
            where necessary to operate the website, or where required by law.
            Access should be limited to legitimate organisational needs.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We use reasonable technical and organisational measures to protect
            information against unauthorised access, alteration, disclosure
            or loss. However, no internet-based system can guarantee absolute
            security.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Data Retention</h2>
          <p>
            Information may be retained for as long as necessary for membership
            administration, organisational records, legitimate operational
            purposes and applicable legal requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Your Privacy Requests</h2>
          <p>
            You may contact the organisation to ask about your personal
            information or request correction of inaccurate details, subject
            to applicable laws and record-retention requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. External Links</h2>
          <p>
            Our website may contain links to third-party websites. Their
            privacy practices are governed by their own policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Policy Updates</h2>
          <p>
            This policy may be updated when our services or practices change.
            The latest version will be published on this page.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Contact Us</h2>
          <p>
            For privacy-related questions or requests, please contact the
            authorised administrator of Our Vision through the organisation's
            official contact channel.
          </p>
        </section>

        <footer className="legal-page-footer">
          <span>Our Vision</span>
          <a href="/terms">Read Terms of Use →</a>
        </footer>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
