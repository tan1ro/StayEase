import { Link } from 'react-router-dom';

const LOGO_SRC = '/stayease_logo.svg';

export default function Logo({ to = '/', variant = 'compact' }) {
  const image = (
    <img
      src={LOGO_SRC}
      alt="StayEase — Smart Hotel Management"
      className={`logo__img${variant === 'full' ? ' logo__img--full' : ''}`}
      decoding="async"
    />
  );

  if (to == null) {
    return <span className="logo">{image}</span>;
  }

  return (
    <Link to={to} className="logo">
      {image}
    </Link>
  );
}
