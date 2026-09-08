import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface LoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
};

const innerLogoSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-18 h-18'
};

export function LogoLoader({ className, size = 'md' }: LoaderProps) {
    return (
        <div className={cn('relative flex items-center justify-center', className)}>
            {/* Outer spinning border */}
            <div
                className={cn(
                    'absolute border-4 border-t-primary border-r-primary/30 border-b-primary/30 border-l-primary/30 rounded-full animate-spin',
                    sizeClasses[size]
                )}
                style={{
                    animationDuration: '1s',
                    animationTimingFunction: 'linear'
                }}
            />
            {/* Static logo in the center */}
            <img
                src={logo}
                alt="Loading..."
                className={cn(
                    'object-contain',
                    innerLogoSizeClasses[size]
                )}
            />
        </div>
    );
}

interface PageLoaderProps {
    message?: string;
    submessage?: string;
}

export function PageLoader({ message, submessage }: PageLoaderProps) {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm px-6 text-center">
            <LogoLoader size="xl" />
            {message && (
                <p className="mt-6 text-lg font-semibold text-foreground">{message}</p>
            )}
            {submessage && (
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{submessage}</p>
            )}
        </div>
    );
}
