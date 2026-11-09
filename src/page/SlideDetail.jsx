import React from 'react';
import './SlideDetail.css';

export default function SlideDetail({ slide, onBack }) {
  if (!slide) return null;

  const { fullInfo } = slide;

  return (
    <div className="slide-detail-page">
      {/* Back button */}
      <button className="slide-back-btn" onClick={onBack}>
        ← Back to Overview
      </button>

      {/* Hero with image */}
      <div
        className="slide-detail-hero"
        style={{ backgroundImage: `url(${slide.image})` }}
      >
        <div className="slide-detail-overlay">
          <p className="slide-detail-subtitle">{fullInfo.subtitle}</p>
          <h1 className="slide-detail-title">{fullInfo.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="slide-detail-content">
        <p className="slide-detail-description">
          {fullInfo.description}
        </p>

        <div className="slide-detail-highlights">
          <h3>Highlights</h3>
          <ul>
            {fullInfo.highlights.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>

        <blockquote className="slide-detail-quote">
          "{fullInfo.quote}"
        </blockquote>
      </div>
    </div>
  );
}