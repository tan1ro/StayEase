import { Cloud, Droplets, Thermometer, Wind } from 'lucide-react';

export default function WeatherWidget({ weather, loading }) {
  if (loading) return <div className="weather-widget card">Loading weather...</div>;
  if (!weather) return null;

  const current = weather.current || weather;

  return (
    <div className="weather-widget card">
      <h4>Weather</h4>
      <div className="weather-widget__main">
        <Cloud size={32} />
        <span className="weather-widget__temp">{current.temperature ?? current.temp}°C</span>
      </div>
      <div className="weather-widget__details">
        <span><Wind size={14} /> {current.windspeed ?? current.wind_speed ?? '—'} km/h</span>
        <span><Droplets size={14} /> {current.humidity ?? '—'}%</span>
        <span><Thermometer size={14} /> Feels {current.apparent_temperature ?? '—'}°C</span>
      </div>
      <style>{`
        .weather-widget { padding: 1rem; }
        .weather-widget h4 { margin-bottom: 0.75rem; }
        .weather-widget__main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .weather-widget__temp { font-size: 1.5rem; font-weight: 700; }
        .weather-widget__details {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .weather-widget__details span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      `}</style>
    </div>
  );
}
