import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import './ContactUs.css';
import SocialBar from './SocialBar';
import { useToast } from './ToastContext';

export default function ContactUs() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Query',
    message: '',
    consent: false
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');

    // Simulate API call
    setTimeout(() => {
      // ✅ SUCCESS: Show toast + inline message
      setStatus('success');
      showToast('Message sent successfully!', 'success');
      
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        subject: 'General Query', 
        message: '', 
        consent: false 
      });
      
      setTimeout(() => setStatus('idle'), 5000);

      /* 
      // ❌ ERROR CASE (Uncomment when connecting to real API)
      setStatus('error');
      showToast('Failed to send message. Please try again.', 'error');
      */
    }, 1500);
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <div className="eyebrow">GET IN TOUCH</div>
        <h1>We'd Love to Hear From You</h1>
        <p>Have a question, want to volunteer, or partner with us? Reach out to our team.</p>
      </div>

      <div className="contact-layout">
        {/* ========================================= */}
        {/* LEFT SIDE - CONTACT DETAILS               */}
        {/* ========================================= */}
        <div className="contact-info-col">
          
          <div className="contact-card">
            <div className="contact-icon purple"><MapPin size={20} /></div>
            <div>
              <h3>Office Address</h3>
              <p>
                <b>Our Vision Office</b><br/>
                House No. 42, New Shastri Nagar, Madhukam,<br/>
                Near Ratu Road, Opposite Shiv Mandir<br/>
                Ranchi, Jharkhand - 834005
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon green"><Phone size={20} /></div>
            <div>
              <h3>Phone / WhatsApp</h3>
              <p>
                <b>+91 9876XXXXXX</b><br/>
                Available Mon-Sat: 10:00 AM - 6:00 PM
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon blue"><Mail size={20} /></div>
            <div>
              <h3>Email Address</h3>
              <p>
                <b>contact@ourvision.org</b><br/>
                For general queries, partnerships and support.
              </p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon orange"><Clock size={20} /></div>
            <div>
              <h3>Office Hours</h3>
              <p>
                <b>Monday to Saturday</b><br/>
                10:00 AM - 6:00 PM<br/>
                (Closed on Sundays & Public Holidays)
              </p>
            </div>
          </div>

          <div className="contact-map">
            <iframe 
              title="Our Vision Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3662.0868777340776!2d85.3261775!3d23.3701754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDIyJzEyLjYiTiA4NcKwMTknMzQuMiJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin" 
              width="100%" 
              height="200" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy"
            ></iframe>
          </div>

        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE - CONTACT FORM                 */}
        {/* ========================================= */}
        <div className="contact-form-col">
          <div className="contact-form-card">
            <h2>Send us a Message</h2>
            <p>Fill out the form below and we will get back to you as soon as possible.</p>

            {status === 'success' && (
              <div className="alert success">
                <CheckCircle2 size={18} />
                Thank you! Your message has been sent successfully.
              </div>
            )}
            
            {status === 'error' && (
              <div className="alert error">
                <AlertCircle size={18} />
                Oops! Something went wrong. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="form-group">
                <label>Subject / Query Type *</label>
                <select name="subject" required value={formData.subject} onChange={handleChange}>
                  <option value="General Query">General Query</option>
                  <option value="Volunteer">I want to Volunteer</option>
                  <option value="Donation">Donation Related</option>
                  <option value="Partnership">Partnership / CSR</option>
                  <option value="Grievance">Grievance / Feedback</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea name="message" required rows="5" value={formData.message} onChange={handleChange} placeholder="Write your message here..."></textarea>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="consent" required checked={formData.consent} onChange={handleChange} />
                  <span>I agree to the Privacy Policy and consent to being contacted.</span>
                </label>
              </div>

              <button type="submit" className="primary-btn submit-btn" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending...' : 'Send Message'} <Send size={16} />
              </button>
            </form>
          </div>

          {/* ========================================= */}
          {/* SOCIAL MEDIA BAR                          */}
          {/* ========================================= */}
          <SocialBar />

        </div>

      </div>
    </div>
  );
}