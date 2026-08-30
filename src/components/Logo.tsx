export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21c4-4.5 7-8.2 7-11.5A7 7 0 0 0 5 9.5C5 12.8 8 16.5 12 21Z"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" fill="var(--accent)" />
      <path
        d="M3 20.5c2.5-1.2 5-1.8 7-1.2M14 19.3c2-.6 4.5 0 7 1.2"
        stroke="var(--accent-2)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
