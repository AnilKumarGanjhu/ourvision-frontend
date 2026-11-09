import StarField from "../components/StarField";
import "./Home.css";

export default function Home() {
  return (
    <div className="home" style={{ position: 'relative', background: 'transparent' }}>
      {/* ⭐ HERO — stars yahan */}
        <section className="hero" style={{ position: 'relative' }}>
        <StarField />
        <div className="hero-content" style={{ position: 'relative', zIndex: 10 }}>
          <h1>OUR VISION</h1>
          <p>Community • Design • Code</p>
          <a href="#about" className="cta">Explore ↓</a>
        </div>
      </section>

      {/* Baaki sections — no stars */}
      <div className="image-slider-container" style={{ position: 'relative', zIndex: 10 }}>
          {/* Tumhara ImageSlider component jo screenshot me dikh raha hai */}
      </div>

    </div>
  );
}