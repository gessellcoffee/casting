import { ReactNode, useMemo } from "react";

interface StarryContainerProps {
    children: ReactNode;
    starCount?: number;
    className?: string;
}

export default function StarryContainer({ children, starCount = 5, className = "" }: StarryContainerProps) {
    // Generate random star positions (memoized to prevent shifting on re-renders)
    const starPositions = useMemo(() => 
        Array.from({ length: starCount }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${8 + Math.random() * 8}px`,
            delay: `${Math.random() * 3}s`
        })),
        [starCount]
    );
    
    return (
        <div className={`starry-container ${className}`} style={{ position: 'relative', isolation: 'isolate' }}>
            {starPositions.map((pos, i) => (
                <div
                    key={i}
                    className="star-decoration"
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        width: pos.size,
                        height: pos.size,
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12 2c-.5 0-.9.2-1.2.6-.3.4-.5.9-.6 1.4-.1.5-.3 1-.6 1.4-.3.4-.7.6-1.2.6-.5 0-1 .2-1.4.6-.4.3-.6.7-.6 1.2 0 .5-.2.9-.6 1.2-.4.3-.9.5-1.4.6-.5.1-1 .3-1.4.6-.4.3-.6.7-.6 1.2s.2.9.6 1.2c.4.3.9.5 1.4.6.5.1 1 .3 1.4.6.4.3.6.7.6 1.2 0 .5.2 1 .6 1.4.3.4.7.6 1.2.6.5 0 .9.2 1.2.6.3.4.5.9.6 1.4.1.5.3 1 .6 1.4.3.4.7.6 1.2.6s.9-.2 1.2-.6c.3-.4.5-.9.6-1.4.1-.5.3-1 .6-1.4.3-.4.7-.6 1.2-.6.5 0 1-.2 1.4-.6.4-.3.6-.7.6-1.2 0-.5.2-.9.6-1.2.4-.3.9-.5 1.4-.6.5-.1 1-.3 1.4-.6.4-.3.6-.7.6-1.2s-.2-.9-.6-1.2c-.4-.3-.9-.5-1.4-.6-.5-.1-1-.3-1.4-.6-.4-.3-.6-.7-.6-1.2 0-.5-.2-1-.6-1.4-.3-.4-.7-.6-1.2-.6-.5 0-.9-.2-1.2-.6-.3-.4-.5-.9-.6-1.4-.1-.5-.3-1-.6-1.4-.3-.4-.7-.6-1.2-.6z'/%3E%3C/svg%3E\")",
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.6,
                        pointerEvents: 'none',
                        animation: `twinkle 3s ease-in-out infinite`,
                        animationDelay: pos.delay,
                        zIndex: -1
                    }}
                />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}
