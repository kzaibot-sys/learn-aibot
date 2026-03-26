import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Card({ title, description, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
      {...props}
    >
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {(title || description) && children ? <div className="mt-4">{children}</div> : children}
    </div>
  );
}
