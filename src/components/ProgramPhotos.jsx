import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { fileUrl, getGalleryPhotos } from "../programApi";
import "./ProgramPhotos.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

/** Photos and videos uploaded to programmes, shown on the Gallery & Events page. */
export default function ProgramPhotos() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    getGalleryPhotos()
      .then((data) => setItems(data || []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="pp-root">
      <h2><Camera size={18} /> From our programmes</h2>
      <div className="pp-grid">
        {items.map((p) => (
          <figure key={p.id} className="pp-item">
            {p.mediaType === "VIDEO" ? (
              <video src={fileUrl(p.fileUrl)} controls preload="metadata" />
            ) : (
              <a href={fileUrl(p.fileUrl)} target="_blank" rel="noreferrer">
                <img src={fileUrl(p.fileUrl)} alt={p.programTitle} loading="lazy" />
              </a>
            )}
            <figcaption className="pp-caption">
              <strong>{p.programTitle}</strong>
              <span>
                {p.mediaType === "VIDEO" ? "Video" : "Photo"} · {fmt(p.createdAt)}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
