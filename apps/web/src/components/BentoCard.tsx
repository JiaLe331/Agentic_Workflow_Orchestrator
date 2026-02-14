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
                "bg-white rounded-3xl p-6 shadow-sm border border-gray-200",
                fullWidth ? "col-span-full" : "",
                className
            )}
        >
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
