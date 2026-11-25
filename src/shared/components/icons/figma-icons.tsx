import type { SVGProps } from 'react';
import { cn } from '@/shared/lib/cn';

type FigmaIconProps = SVGProps<SVGSVGElement>;

export function FigmaSearchIcon({ className, ...props }: FigmaIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5', className)}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      >
        <circle cx="11" cy="11" r="7.6" />
        <path d="M16.6 16.6 21 21" />
      </g>
    </svg>
  );
}

export function FigmaCartIcon({ className, ...props }: FigmaIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-6', className)}
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        transform="translate(3.65 2.85)"
      >
        <path d="M2.044 3.58024493C7.3705141 2.243 13.9926469 2.32498848 15.5231061 4.06777179C17.0535652 5.8105551 17.0220031 11.638 15.2330031 13.237C13.4450031 14.836 5.68 14.988 3.22 13.237C0.621 11.386 2.129 5.692 2.044 2.243C2.095 0.313-1.13686838e-13 0-1.13686838e-13 0" />
        <line x1="10.5059" x2="13.2789" y1="7.8696" y2="7.8696" />
        <path
          fill="currentColor"
          d="M3.6138 17.2773C3.9138 17.2773 4.1578 17.5213 4.1578 17.8213C4.1578 18.1223 3.9138 18.3663 3.6138 18.3663C3.3128 18.3663 3.0688 18.1223 3.0688 17.8213C3.0688 17.5213 3.3128 17.2773 3.6138 17.2773Z"
        />
        <path
          fill="currentColor"
          d="M13.9453 17.2773C14.2463 17.2773 14.4903 17.5213 14.4903 17.8213C14.4903 18.1223 14.2463 18.3663 13.9453 18.3663C13.6453 18.3663 13.4013 18.1223 13.4013 17.8213C13.4013 17.5213 13.6453 17.2773 13.9453 17.2773Z"
        />
      </g>
    </svg>
  );
}

export function FigmaLogoutIcon({ className, ...props }: FigmaIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5', className)}
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        transform="translate(2 2)"
      >
        <line x1="19.791" x2="7.75" y1="10.1207" y2="10.1207" />
        <polyline points="16.8643 7.2047 19.7923 10.1207 16.8643 13.0367" />
        <path
          d="M0.2588 5.6299C0.5888 2.0499 1.9288 0.7499 7.2588 0.7499C14.3598 0.7499 14.3598 3.0599 14.3598 9.9999C14.3598 16.9399 14.3598 19.2499 7.2588 19.2499C1.9288 19.2499 0.5888 17.9499 0.2588 14.3699"
          transform="matrix(-1 0 0 1 14.619 0)"
        />
      </g>
    </svg>
  );
}
