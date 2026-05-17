export function RobotAvatar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="4"
        width="10"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="6" cy="7.5" r="0.9" fill="currentColor" />
      <circle cx="10" cy="7.5" r="0.9" fill="currentColor" />
      <path
        d="M6 10.5h4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M8 2v2M5 2.5h6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
