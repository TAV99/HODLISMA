'use client';

import { useState, useCallback, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoloCardWrapperProps {
    children: ReactNode;
    className?: string;
    intensity?: number; // Tilt intensity (default: 15)
    glareOpacity?: number; // Glare/foil opacity on hover (default: 0.15)
}

/**
 * Holographic Card Wrapper
 * Adds 3D tilt effect and rainbow foil overlay on mouse interaction
 */
export function HoloCardWrapper({
    children,
    className,
    intensity = 15,
    glareOpacity = 0.15,
}: HoloCardWrapperProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Mouse position state (percentage 0-100)
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);

    // Handle mouse move - calculate position relative to card
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setMousePosition({ x, y });
    }, []);

    // Reset to center on mouse leave
    const handleMouseLeave = useCallback(() => {
        setMousePosition({ x: 50, y: 50 });
        setIsHovering(false);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    // Calculate rotation based on mouse position
    // Invert Y for natural tilt (mouse up = tilt back)
    const rotateX = ((mousePosition.y - 50) / 50) * -intensity;
    const rotateY = ((mousePosition.x - 50) / 50) * intensity;

    // Calculate gradient position for foil effect
    const gradientX = mousePosition.x;
    const gradientY = mousePosition.y;

    return (
        <div
            className={cn("perspective-1000", className)}
            style={{ perspective: '1000px' }}
        >
            <div
                ref={cardRef}
                className="relative transition-transform duration-200 ease-out will-change-transform"
                style={{
                    transform: isHovering
                        ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
                        : 'rotateX(0deg) rotateY(0deg) scale(1)',
                    transformStyle: 'preserve-3d',
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Card Content */}
                {children}

                {/* Holographic Foil Layer */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
                        isHovering ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        backgroundImage: `linear-gradient(
                            ${115 + (mousePosition.x - 50) * 0.5}deg,
                            transparent 0%,
                            rgba(0, 255, 255, ${glareOpacity}) 20%,
                            rgba(255, 0, 255, ${glareOpacity * 1.2}) 40%,
                            rgba(255, 255, 0, ${glareOpacity}) 60%,
                            rgba(0, 255, 128, ${glareOpacity * 0.8}) 80%,
                            transparent 100%
                        )`,
                        backgroundSize: '200% 200%',
                        backgroundPosition: `${gradientX}% ${gradientY}%`,
                        mixBlendMode: 'overlay',
                    }}
                />

                {/* Gloss/Shine Layer */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
                        isHovering ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        backgroundImage: `radial-gradient(
                            circle at ${gradientX}% ${gradientY}%,
                            rgba(255, 255, 255, 0.25) 0%,
                            rgba(255, 255, 255, 0.1) 20%,
                            transparent 50%
                        )`,
                    }}
                />

                {/* Subtle Border Glow */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 rounded-2xl transition-all duration-300",
                        isHovering ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        boxShadow: `
              0 0 20px rgba(99, 102, 241, 0.3),
              0 0 40px rgba(139, 92, 246, 0.2),
              inset 0 0 30px rgba(255, 255, 255, 0.05)
            `,
                    }}
                />
            </div>
        </div>
    );
}
