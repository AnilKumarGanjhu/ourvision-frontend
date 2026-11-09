
import React from "react";
import "./TermsOfUse.css";

const TermsOfUse = () => {
  return (
    <main className="legal-page terms-page">
      <div className="legal-container">
        <a href="/" className="legal-back-link">
          ← Back to Home
        </a>

        <header className="legal-header">
          <span className="legal-eyebrow">OUR VISION</span>
          <h1>Terms of Use</h1>
          <p>
            These terms describe the basic rules for accessing and using the
            Our Vision website and its services.
          </p>
        </header>

        <p className="legal-updated">
          Last updated: October 2026
        </p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Our Vision website, you agree to follow
            these Terms of Use and applicable laws. If you do not agree, please
            discontinue use of the website.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. About Our Website</h2>
          <p>
            The website supports organisational activities such as membership
            administration, announcements, events, attendance, contributions
            and other services made available by the organisation.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Member Accounts</h2>
          <ul>
            <li>Provide accurate information when creating or updating a profile.</li>
            <li>Keep your login credentials confidential.</li>
            <li>Do not share your account with unauthorised persons.</li>
            <li>Notify the administrator if you suspect unauthorised account access.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <p>You must not:</p>
          <ul>
            <li>Use the website for unlawful, fraudulent or harmful activities.</li>
            <li>Attempt to access another person's account or private information.</li>
            <li>Disrupt, damage or interfere with website operations.</li>
            <li>Upload malicious code or unauthorised content.</li>
            <li>Misuse organisational information or member records.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Contributions and Records</h2>
          <p>
            Contribution records and related information displayed on the
            website are intended for organisational administration. Members
            should contact the authorised administrator if they notice an
            incorrect entry. Any contribution terms or payment arrangements
            separately communicated by the organisation continue to apply.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Intellectual Property</h2>
          <p>
            Website text, branding, graphics and other materials may belong to
            Our Vision or their respective owners. They must not be copied,
            republished or used commercially without appropriate permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Third-Party Services</h2>
          <p>
            The website may rely on third-party platforms or link to external
            websites. Our Vision is not responsible for the independent
            policies, availability or content of those services.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Service Availability</h2>
          <p>
            We aim to keep the website available and functional, but
            interruptions may occur due to maintenance, technical problems or
            circumstances outside our control.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Account Restrictions</h2>
          <p>
            Access may be restricted where necessary to protect the website,
            investigate suspected misuse or comply with applicable legal
            requirements. Any action will be subject to applicable laws and
            the organisation's policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Changes to These Terms</h2>
          <p>
            These terms may be updated from time to time. Updated terms will
            be published on this page, along with the revised date.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact and Questions</h2>
          <p>
            If you have questions about these terms, please contact the
            authorised administrator through the organisation's official
            contact channel.
          </p>
        </section>

        <footer className="legal-page-footer">
          <span>Our Vision</span>
          <a href="/privacy">Read Privacy Policy →</a>
        </footer>
      </div>
    </main>
  );
};

export default TermsOfUse;
