import React, { useState } from "react";
import "./Volunteer.css";

export default function Volunteer() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    interest: "",
    availability: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Frontend validation only.
    // Connect this form to your Spring Boot API to save applications.
    setSubmitted(true);
  };

  return (
    <main className="volunteer-page">
      <section className="volunteer-hero">
  <div className="volunteer-hero-inner">
    <a href="/" className="legal-back-link">
      ← Back to Home
    </a>

    <div className="volunteer-hero-content">
      <span className="volunteer-tag">JOIN OUR COMMUNITY</span>
      <h1>Be the Reason Someone Smiles</h1>
      <p>
        Your time, skills, and kindness can make a real difference. Join Our
        Vision and help us build a stronger, more supportive community.
      </p>
      <a href="#volunteer-form" className="volunteer-primary-btn">
        Become a Volunteer
      </a>
    </div>
  </div>
</section>

      <section className="volunteer-intro">
        <h2>Make a Difference with Our Vision</h2>
        <p>
          We believe meaningful change begins when people come together.
          Whether you can offer a few hours or contribute your professional
          skills, there is a place for you in our community.
        </p>
      </section>

      <section className="volunteer-opportunities">
        <article className="volunteer-card">
          <div className="volunteer-icon">🤝</div>
          <h3>Community Support</h3>
          <p>
            Help community members, support local initiatives, and
            encourage people to work together.
          </p>
        </article>

        <article className="volunteer-card">
          <div className="volunteer-icon">📚</div>
          <h3>Education & Awareness</h3>
          <p>
            Participate in educational activities, awareness campaigns,
            and knowledge-sharing initiatives.
          </p>
        </article>

        <article className="volunteer-card">
          <div className="volunteer-icon">🌱</div>
          <h3>Community Development</h3>
          <p>
            Contribute your ideas, skills, and time to projects that
            support long-term community development.
          </p>
        </article>
      </section>

      <section className="volunteer-form-section" id="volunteer-form">
        <div className="volunteer-form-info">
          <span className="volunteer-tag">GET INVOLVED</span>
          <h2>Become a Volunteer</h2>
          <p>
            Fill out the form to express your interest. Our team can
            contact you to discuss suitable opportunities.
          </p>

          <div className="volunteer-note">
            <span>✓</span>
            Contribute at your convenience
          </div>
          <div className="volunteer-note">
            <span>✓</span>
            Share your skills and ideas
          </div>
          <div className="volunteer-note">
            <span>✓</span>
            Be part of a supportive community
          </div>
        </div>

        <div className="volunteer-form-card">
          {submitted ? (
            <div className="volunteer-success">
              <div className="volunteer-success-icon">✓</div>
              <h3>Thank You for Your Interest!</h3>
              <p>
                Your form has been validated, but it has not yet been
                saved or sent. Please connect the form to the Our Vision
                backend to submit your application.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="volunteer-submit-btn"
              >
                Back to Form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>Volunteer Registration</h3>
              <p className="volunteer-form-subtitle">
                Tell us a little about yourself.
              </p>

              <div className="volunteer-field">
                <label htmlFor="vol-fullName">Full Name *</label>
                <input
                  id="vol-fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="volunteer-field-row">
                <div className="volunteer-field">
                  <label htmlFor="vol-email">Email Address *</label>
                  <input
                    id="vol-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="volunteer-field">
                  <label htmlFor="vol-phone">Phone Number *</label>
                  <input
                    id="vol-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    pattern="[0-9+() -]{8,20}"
                    title="Enter a valid phone number"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-field">
                <label htmlFor="vol-interest">Area of Interest *</label>
                <select
                  id="vol-interest"
                  name="interest"
                  value={form.interest}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an activity</option>
                  <option value="Community Support">Community Support</option>
                  <option value="Education">Education & Awareness</option>
                  <option value="Community Development">
                    Community Development
                  </option>
                  <option value="Technology">Technology & IT Support</option>
                  <option value="Events">Events & Coordination</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="volunteer-field">
                <label htmlFor="vol-availability">Availability *</label>
                <select
                  id="vol-availability"
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your availability</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Weekends">Weekends</option>
                  <option value="Flexible">Flexible</option>
                  <option value="Occasionally">Occasionally</option>
                </select>
              </div>

              <div className="volunteer-field">
                <label htmlFor="vol-message">
                  Tell us about yourself (optional)
                </label>
                <textarea
                  id="vol-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your skills, interests, or ideas..."
                  rows="4"
                />
              </div>

              <button type="submit" className="volunteer-submit-btn">
                Submit Interest
              </button>

              <p className="volunteer-privacy-note">
                Your information should be handled securely and used only
                for volunteer coordination.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
