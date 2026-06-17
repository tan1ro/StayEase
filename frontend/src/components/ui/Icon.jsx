export const ICON = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 40,
};

export const STROKE = 1.5;

export function Icon({
  icon: LucideIcon,
  size = ICON.md,
  strokeWidth = STROKE,
  ...props
}) {
  if (!LucideIcon) return null;
  return <LucideIcon size={size} strokeWidth={strokeWidth} aria-hidden {...props} />;
}
