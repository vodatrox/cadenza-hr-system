'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiChevronRight } from 'react-icons/fi';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  departments: 'Departments',
  payroll: 'Payroll',
  batches: 'Batches',
  periods: 'Periods',
  create: 'Create',
  settings: 'Settings',
  reports: 'Reports',
  new: 'New Employee',
  edit: 'Edit',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const isId = /^\d+$/.test(segment);
    const label = isId ? `#${segment}` : routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 && <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          {crumb.isLast ? (
            <span className="text-slate-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
