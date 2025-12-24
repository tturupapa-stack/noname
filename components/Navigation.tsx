'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'HOME', shortLabel: 'H' },
  { href: '/briefings', label: 'DAILY HOT', shortLabel: 'D' },
  { href: '/saved-briefings', label: 'MY ANALYSIS', shortLabel: 'M' },
  { href: '/alerts', label: 'ALERTS', shortLabel: 'A' },
  { href: '/favorites', label: 'FAVORITES', shortLabel: 'F' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all group ${
              isActive
                ? 'text-[var(--foreground)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {/* Active Indicator - Bottom Line */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)]" />
            )}
            {/* Hover Indicator */}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />

            {/* Desktop: Full Label */}
            <span className="hidden lg:inline">{item.label}</span>
            {/* Tablet: Short Label */}
            <span className="lg:hidden">{item.shortLabel}</span>

            {/* Separator */}
            {index < navItems.length - 1 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-[var(--border)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
