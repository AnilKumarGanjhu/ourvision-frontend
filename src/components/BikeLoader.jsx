export default function BikeLoader({ text = 'Loading' }) {
  return (
    <div className="page-loader">
      <span className="bike-loader"></span>
      <span className="loader-text">{text}</span>
    </div>
  );
}