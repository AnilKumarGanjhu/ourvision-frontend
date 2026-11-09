import { useEffect, useState } from "react";
import "./BirthdayBanner.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function BirthdayBanner() {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBirthdays(isInitialLoad = false) {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        const token = localStorage.getItem("ourvision_token");

        const response = await fetch(`${API_BASE}/api/birthdays/today`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "Birthday list dekhne ke liye login permission check karein."
              : "Birthday list load nahi ho saki."
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Birthday API ka response format sahi nahi hai.");
        }

        setBirthdays(data);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Birthday API error:", err);
          setError(err.message || "Kuch galat ho gaya.");
        }
      } finally {
        if (isInitialLoad && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBirthdays(true);

    // Har 5 minute mein birthday list automatically refresh hogi.
    const intervalId = setInterval(() => {
      loadBirthdays(false);
    }, 5 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  // Initial loading ke time banner show nahi hoga.
  if (loading) {
    return null;
  }

  // API error hone par banner hide rahega.
  if (error) {
    return null;
  }

  // Aaj kisi member ka birthday nahi hai to banner hide rahega.
  if (!birthdays || birthdays.length === 0) {
    return null;
  }

  // Birthday hone par hi banner show hoga.
  return (
    <section className="birthday-section">
      <div className="birthday-heading">
        <span className="birthday-icon">🎂</span>

        <div>
          <h2>Today's Birthdays</h2>
          <p>
            Aaj hamare {birthdays.length} member
            {birthdays.length === 1 ? "" : "s"} ka special day hai!
          </p>
        </div>
      </div>

      <div className="birthday-grid">
        {birthdays.map((member) => (
          <article className="birthday-card" key={member.id}>
            <div className="birthday-confetti" aria-hidden="true">
              🎊 ✨ 🎈
            </div>

            <div className="birthday-avatar">
              {(member.fullName || "M")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="birthday-card-content">
              <span className="birthday-label">SPECIAL DAY</span>

              <h3>{member.fullName || "Our Vision Member"}</h3>

              <p className="birthday-wish-title">
                Happy Birthday! 🎉
              </p>

              <p className="birthday-wish-message">
                Aapka aane wala saal khushiyon, safalta,
                achhe swasthya aur naye avsaron se bhara rahe.
              </p>

              <div className="birthday-signature">
                With best wishes,
                <strong>Our Vision Family ❤️</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}