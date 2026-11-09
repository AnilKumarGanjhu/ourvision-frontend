import React, { useState, useEffect, useRef } from 'react';
import './ImageSlider.css';

// items: [{ id, name, image, ... }]  — onSlideClick receives the full item.
const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

const ImageSlider = ({ items = [], onSlideClick }) => {
  const count = items.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Keep the index valid when the list shrinks (e.g. after a delete).
  useEffect(() => {
    if (count && currentIndex >= count) setCurrentIndex(0);
  }, [count, currentIndex]);

  // Auto slide. Restarts whenever the index changes, so manual navigation resets the timer.
  useEffect(() => {
    if (isPaused || count < 2) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, currentIndex, count]);

  if (count === 0) {
    return (
      <div className="carousel-3d carousel-empty">
        <p>No member photos to show yet.</p>
      </div>
    );
  }

  const getPosition = (index) => {
    let diff = index - currentIndex;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  };

  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + count) % count);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % count);

  const currentItem = items[currentIndex];

  return (
    <div className="carousel-3d">
      {items.map((item, index) => {
        const pos = getPosition(index);
        let className = 'carousel-slide';
        if (pos === 0) className += ' active';
        else if (pos === 1) className += ' next';
        else if (pos === 2) className += ' next-next';
        else if (pos === -1) className += ' prev';
        else if (pos === -2) className += ' prev-prev';

        return (
          <div className={className} key={item.id}>
            {item.image ? (
              <img src={item.image} alt={item.name} />
            ) : (
              <div className="carousel-initials">{initials(item.name)}</div>
            )}
          </div>
        );
      })}

      <button className="nav-arrow nav-arrow-left" onClick={goPrev} aria-label="Previous slide" title="Previous">
        ‹
      </button>
      <button className="nav-arrow nav-arrow-right" onClick={goNext} aria-label="Next slide" title="Next">
        ›
      </button>

      <button
        className="pause-slider-btn"
        onClick={() => setIsPaused((p) => !p)}
        aria-label={isPaused ? 'Play' : 'Pause'}
        title={isPaused ? 'Play slideshow' : 'Pause slideshow'}
      >
        {isPaused ? '▶' : '❚❚'}
      </button>

      <div className="carousel-bottom">
        <button className="slide-name-btn" onClick={() => onSlideClick?.(currentItem)}>
          {currentItem.name}
          <span>→</span>
        </button>

        <div className="carousel-dots">
          {items.map((item, i) => (
            <button
              key={item.id}
              className={i === currentIndex ? 'dot active' : 'dot'}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Show ${item.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
