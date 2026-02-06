'use client';

import { useEffect, useRef } from 'react';
import { useSpring, useMotionValue, useTransform, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
    value: number;
    format?: (value: number) => string;
    className?: string;
    springOptions?: {
        stiffness?: number;
        damping?: number;
        mass?: number;
    };
}

/**
 * AnimatedNumber component
 * Smoothly animates a number from its previous value to the new value using a spring physics simulation.
 */
export function AnimatedNumber({
    value,
    format = (v) => v.toString(),
    className,
    springOptions = { stiffness: 100, damping: 30, mass: 1 },
}: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, springOptions);
    const displayValue = useTransform(springValue, (latest) => format(latest));

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    useEffect(() => {
        // Subscribe to value changes to update the text content directly
        // This avoids React re-renders for every frame of the animation
        const unsubscribe = springValue.on('change', (latest) => {
            if (ref.current) {
                ref.current.textContent = format(latest);
            }
        });

        return () => unsubscribe();
    }, [springValue, format]);

    return (
        <span ref={ref} className={cn('tabular-nums', className)}>
            {format(value)}
        </span>
    );
}
