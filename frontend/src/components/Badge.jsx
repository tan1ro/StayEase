export default function Badge({ children, variant = 'primary', ...rest }) {
  return (
    <span className={`badge badge--${variant}`} {...rest}>
      {children}
    </span>
  );
}
