import React from 'react';
import { cn } from '../../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, children, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-medium text-zinc-400 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            'w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200',
                            'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-zinc-900',
                            'hover:bg-zinc-900/80 hover:border-zinc-700',
                            'appearance-none cursor-pointer',
                            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10',
                            className
                        )}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a1a1aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                        }}
                        {...props}
                    >
                        {children}
                    </select>
                </div>
                {error && (
                    <p className="text-xs text-red-400 ml-1 animate-fade-in">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
