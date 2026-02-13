import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    fullWidth?: boolean;
}

export function BentoCard({ children, className, title, subtitle, fullWidth = false }: BentoCardProps) {
    return (
        <div
            className={cn(
                "bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800",
                fullWidth ? "col-span-full" : "",
                className
            )}
        >
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
