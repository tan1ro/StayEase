export default function Badge({ children, variant = 'primary', className = '', ...rest }) {
  return (
    <span className={`badge badge--${variant}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </span>
  );
}
