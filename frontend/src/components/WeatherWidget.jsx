import { Cloud, CloudFog, CloudRain, CloudSnow, Sun } from 'lucide-react';

function iconForWeatherCode(code) {
  const value = Number(code);
  if (value === 0) return Sun;
  if (value <= 3) return Cloud;
  if (value <= 48) return CloudFog;
  if (value <= 67) return CloudRain;
  if (value <= 77) return CloudSnow;
  if (value <= 82) return CloudRain;
  return Cloud;
}

function labelForWeatherCode(code) {
  const value = Number(code);
  if (value === 0) return 'Clear sky';
  if (value <= 3) return 'Partly cloudy';
  if (value <= 48) return 'Foggy';
  if (value <= 67) return 'Rainy';
  if (value <= 77) return 'Snowy';
  if (value <= 82) return 'Showers';
  return 'Cloudy';
}

export default function WeatherWidget({ weather, loading }) {
  if (loading) return <div className="card weather-widget">Loading weather...</div>;
  if (!weather) return null;

  const current = weather.current || weather;
  const temp = current.temperature ?? current.temp;
  const wind = current.windspeed ?? current.wind_speed;
  const code = current.weathercode ?? current.weather_code;
  const WeatherIcon = iconForWeatherCode(code);

  return (
    <div className="card weather-widget">
      <h4>Weather now</h4>
      <div className="weather-widget__main">
        <WeatherIcon size={32} aria-hidden="true" />
        <span className="weather-widget__temp">{temp != null ? `${Math.round(temp)}°C` : '—'}</span>
      </div>
      <p className="listing-muted">{labelForWeatherCode(code)}</p>
      {wind != null && (
        <p className="listing-muted">Wind {Math.round(wind)} km/h</p>
      )}
    </div>
  );
}
