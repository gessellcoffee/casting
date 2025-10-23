import { ReactNode } from "react";

interface StarryContainerProps {
    children: ReactNode;
    starCount?: number; // Kept for backwards compatibility but not used
    className?: string;
}

/**
 * Container component for neumorphic design
 * Removed starry background to match clean neumorphic aesthetic
 */
export default function StarryContainer({ children, className = "" }: StarryContainerProps) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}
