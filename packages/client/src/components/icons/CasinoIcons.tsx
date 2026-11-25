import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const PokerChipIcon: React.FC<IconProps & { variant?: 'blue' | 'pink' | 'gold' }> = ({
  size = 18,
  className = '',
  variant = 'blue',
}) => {
  const colors =
    variant === 'pink'
      ? { a: '#ff6ca8', b: '#db2777', inner: '#9d174d' }
      : variant === 'gold'
      ? { a: '#fbbf24', b: '#d97706', inner: '#78350f' }
      : { a: '#53b7ff', b: '#2563eb', inner: '#1e3a8a' };
  const gid = `chip-${variant}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`casino-icon ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10.5" fill={`url(#${gid})`} stroke="#e2e8f0" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="6.8" fill={colors.inner} stroke="#f8fafc" strokeWidth="1.2" strokeDasharray="2.6 2" />
      <path d="M9.5 14.5c1.2-1 2.2-1.2 2.5-2.5.3-1.2 1.3-1.5 2.5-2.5" stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 1.5v2.6M12 19.9v2.6M1.5 12h2.6M19.9 12h2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M19.4 4.6l-1.9 1.9M6.5 17.5l-1.9 1.9" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.a} />
          <stop offset="1" stopColor={colors.b} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const SuitVectorIcon: React.FC<{ suit: string; size?: number; className?: string }> = ({
  suit,
  size = 18,
  className = '',
}) => {
  if (suit === 'hearts') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`casino-icon suit-svg ${className}`} aria-hidden="true">
        <defs>
          <linearGradient id="suitHeart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff9ec4" />
            <stop offset="100%" stopColor="#f45b93" />
          </linearGradient>
        </defs>
        <path fill="url(#suitHeart)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  if (suit === 'diamonds') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`casino-icon suit-svg ${className}`} aria-hidden="true">
        <defs>
          <linearGradient id="suitDiamond" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#99f6ff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path fill="url(#suitDiamond)" d="M12 2C14.8 6.4 18.6 9.8 22 12c-3.4 2.2-7.2 5.6-10 10-2.8-4.4-6.6-7.8-10-10 3.4-2.2 7.2-5.6 10-10z" />
      </svg>
    );
  }
  if (suit === 'clubs') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`casino-icon suit-svg ${className}`} aria-hidden="true">
        <defs>
          <linearGradient id="suitClub" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#9368ff" />
          </linearGradient>
        </defs>
        <path fill="url(#suitClub)" d="M12 2.5a4.3 4.3 0 0 0-3.7 6.5A4.4 4.4 0 0 0 3 13.2a4.3 4.3 0 0 0 7.7 2.6c-.2 2-.8 3.6-2 5.2h6.6c-1.2-1.6-1.8-3.2-2-5.2A4.3 4.3 0 0 0 21 13.2a4.4 4.4 0 0 0-5.3-4.2A4.3 4.3 0 0 0 12 2.5z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`casino-icon suit-svg ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id="suitSpade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5c4ff" />
          <stop offset="100%" stopColor="#5b8cff" />
        </linearGradient>
      </defs>
      <path fill="url(#suitSpade)" d="M12 2C9.3 6.2 3.5 9.6 3.5 14a4.7 4.7 0 0 0 7.5 3.7c-.2 1.7-.9 3.1-2.2 4.3h6.4c-1.3-1.2-2-2.6-2.2-4.3A4.7 4.7 0 0 0 20.5 14C20.5 9.6 14.7 6.2 12 2z" />
    </svg>
  );
};

export const MenuBarsIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={`casino-icon ${className}`} aria-hidden="true">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="15" y2="12" />
    <line x1="4" y1="17" x2="11" y2="17" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size = 17, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M12 3.2 3.5 10.4a1 1 0 0 0 .65 1.76H6v7.34A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5v-7.34h1.85a1 1 0 0 0 .65-1.76L12 3.2zm0 8.8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  </svg>
);

export const ExitDoorIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h7A2.5 2.5 0 0 1 17 4.5V8h-2V4.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V16h2v3.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 5 19.5v-15z" />
    <path d="M15.8 8.3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4l-3 3a1 1 0 0 1-1.4-1.4l1.3-1.3H11a1 1 0 1 1 0-2h6.1l-1.3-1.3a1 1 0 0 1 0-1.4z" />
  </svg>
);

export const FoldArrowIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M12.7 5.3a1 1 0 0 0-1.4 0l-6 6a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.7-.7v-3.5h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5V6a1 1 0 0 0-.3-.7z" />
  </svg>
);

export const RaiseArrowIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M11.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6A1 1 0 0 1 11 18v-3.5H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h5V6a1 1 0 0 1 .3-.7z" />
  </svg>
);

export const SoundOnIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const SoundOffIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.15" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

export const ChatIcon: React.FC<IconProps> = ({ size = 17, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9.8l-3.9 3.2A.9.9 0 0 1 4.4 18.5V16A2.5 2.5 0 0 1 4 14.6v-9.1z" fillOpacity="0.92" />
  </svg>
);

export const BotIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <rect x="3" y="8" width="18" height="12" rx="3" fill="currentColor" fillOpacity="0.18" />
    <path d="M12 8V4H9" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" />
    <circle cx="15" cy="14" r="1.2" fill="currentColor" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const SeatPlusIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" fillOpacity="0.18" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const SpadeEmblemIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <path d="M12 2C9.5 6.2 4 9.6 4 14a4.5 4.5 0 0 0 7.2 3.6c-.2 1.7-.9 3.1-2.2 4.4h6c-1.3-1.3-2-2.7-2.2-4.4A4.5 4.5 0 0 0 20 14c0-4.4-5.5-7.8-8-12z" />
  </svg>
);

export const TableMiniIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`casino-icon ${className}`} aria-hidden="true">
    <ellipse cx="12" cy="9" rx="9" ry="4" fillOpacity="0.9" />
    <path d="M10.5 13h3v5.5l3 1.5H7.5l3-1.5V13z" fillOpacity="0.7" />
  </svg>
);
