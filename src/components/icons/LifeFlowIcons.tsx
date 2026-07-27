import type { ReactNode, SVGProps } from "react";

export type LifeFlowIconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({
  size = 20,
  children,
  ...props
}: LifeFlowIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
      <path d="M8.5 8.8c2.2 1.3 4.8 1.3 7 0" />
    </IconBase>
  );
}

export function MoneyFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
      <circle cx="17" cy="15" r="1.5" />
    </IconBase>
  );
}

export function AgendaFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4" width="15" height="17" rx="2.5" />
      <path d="M8 2v4M16 2v4M5 9h15" />
      <path d="m9 14 1.5 1.5L14 12" />
    </IconBase>
  );
}

export function WeekFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 9v11M16 9v11" />
      <path d="M6 6.5h2M11 6.5h2M16 6.5h2" />
    </IconBase>
  );
}

export function HealthFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.5 9.2c0 5-8.5 10.1-8.5 10.1S3.5 14.2 3.5 9.2A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.5 1.6Z" />
      <path d="M7.5 11.5h2.2l1.2-2.4 2.1 5 1.2-2.6h2.3" />
    </IconBase>
  );
}

export function GoalFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 21V4" />
      <path d="M6 5h10.5l-2 3 2 3H6" />
      <path d="M3.5 21h5" />
    </IconBase>
  );
}

export function HistoryFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h7M8 12h8M8 16h5" />
      <path d="M3 7V3h4" />
    </IconBase>
  );
}

export function FilesFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3h7l4 4v12H7z" />
      <path d="M14 3v5h4M10 12h5M10 15h5" />
      <path d="M4 6v15h11" />
    </IconBase>
  );
}

export function PeopleFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <circle cx="10" cy="9" r="2.2" />
      <path d="M7 16c.6-2 1.6-3 3-3s2.4 1 3 3M16 8h1M16 12h1M16 16h1" />
    </IconBase>
  );
}

export function SlidersFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h6M14 7h6M4 17h10M18 17h2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </IconBase>
  );
}

export function DayFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 18h16" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M12 3v3M5.6 7.2l2.1 2.1M18.4 7.2l-2.1 2.1M3 13h3M18 13h3" />
    </IconBase>
  );
}

export function IncomeFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </IconBase>
  );
}

export function ExpenseFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20V7M7 12l5-5 5 5" />
      <path d="M5 4h14" />
    </IconBase>
  );
}

export function TaskFlowIcon(props: LifeFlowIconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="m8 12 2.2 2.2L16 8.8" />
    </IconBase>
  );
}
