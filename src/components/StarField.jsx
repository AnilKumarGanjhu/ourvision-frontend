import { useEffect, useRef } from "react";
import "./StarField.css";

export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Screen size set karo
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Stars generate karo
    const stars = [];
    const numStars = 200; // Kitne stars chahiye

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5, // Star size
        speed: Math.random() * 0.8 + 0.2, // Speed
        opacity: Math.random(),
      });
    }

    // Animation loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        // Star upar jayega
        star.y -= star.speed;

        // Agar screen se bahar jaye, toh niche se wapas lao
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Resize handle karo
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="star-field">
      <canvas ref={canvasRef} className="star-canvas" />
    </div>
  );
}