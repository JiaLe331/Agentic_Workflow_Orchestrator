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
                "bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow",
                fullWidth ? "col-span-full" : "",
                className
            )}
        >
            {(title || subtitle || headerAction) && (
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        {title && (
                            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {headerAction && (
                        <div>{headerAction}</div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
