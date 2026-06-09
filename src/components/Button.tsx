import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-hanwha-500 to-hanwha-700 text-white shadow-lg shadow-hanwha-600/25 hover:from-hanwha-600 hover:to-hanwha-700',
  secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50',
  ghost: 'text-hanwha-700 hover:bg-hanwha-50',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
};

export function Button({ children, variant = 'primary', fullWidth, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition active:scale-[0.99] disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hanwha-100 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
