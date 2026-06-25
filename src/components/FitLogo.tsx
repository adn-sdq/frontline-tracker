interface Props {
  className?: string
  size?: number
  orangeColor?: string
  navyColor?: string
}

export function FitLogo({
  className,
  size = 32,
  orangeColor = "#E37C30",
  navyColor = "#1B354F",
}: Props) {
  // viewBox is 512×384 (4:3) — height auto-computed to preserve aspect ratio
  const h = Math.round(size * 0.75)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 512 384"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FIT logo"
    >
      <path
        d="M257.214 8.5H161.195L257.962 113.166H342.879L296.276 66.5628H445.187L503.25 8.5H257.214Z"
        stroke={orangeColor}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M291.159 149.073L330.741 191.886L161.195 375.273H250.214L421.6 191.886L378.786 149.073H291.159Z"
        stroke={orangeColor}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.50024 8.5L193.046 191.886L8.50024 375.273H104.519L277.905 191.886L104.519 8.5H8.50024Z"
        stroke={navyColor}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
