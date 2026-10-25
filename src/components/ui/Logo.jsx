export default function Logo({ size = 36, className = '' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="12" fill="var(--color-accent)" />
      <path
        d="M9 26.5 16 19l4.5 4.5L31 11"
        fill="none"
        stroke="var(--color-bg-primary)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="11" r="2.6" fill="var(--color-bg-primary)" />
    </svg>
  );
}
