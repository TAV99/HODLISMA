'use client';

import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFearGreed } from '@/lib/hooks/use-fear-greed';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';

function getClassificationColor(classification: string): string {
    const lower = classification.toLowerCase();
    if (lower.includes('extreme fear') || lower.includes('fear')) return 'text-rose-600 dark:text-rose-400';
    if (lower.includes('neutral')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-emerald-600 dark:text-emerald-400';
}

function getArcColor(value: number): string {
    if (value <= 25) return '#f43f5e';
    if (value <= 50) return '#f59e0b';
    if (value <= 75) return '#84cc16';
    return '#10b981';
}

function formatTimestamp(timestamp: string): string {
    try {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return timestamp;
    }
}

function SkeletonGauge() {
    return (
        <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6 animate-pulse">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-700 rounded mb-4 mx-auto" />
            <div className="flex justify-center">
                <div className="w-[200px] h-[120px] bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            </div>
            <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded mt-4 mx-auto" />
            <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mt-2 mx-auto" />
        </div>
    );
}

const RADIUS = 80;
const TOTAL_ARC = Math.PI * RADIUS;

function AnimatedGaugeValue({ value }: { value: number }) {
    const springValue = useSpring(0, { stiffness: 60, damping: 20, mass: 1 });
    const display = useTransform(springValue, (v) => Math.round(v).toString());

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    return (
        <motion.tspan>{display}</motion.tspan>
    );
}

function AnimatedArc({ value, color }: { value: number; color: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const targetLength = (value / 100) * TOTAL_ARC;

    return (
        <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${TOTAL_ARC}` }}
            animate={{ strokeDasharray: mounted ? `${targetLength} ${TOTAL_ARC}` : `0 ${TOTAL_ARC}` }}
            transition={{ type: 'spring', stiffness: 40, damping: 15, mass: 1 }}
        />
    );
}

function AnimatedCountUp({ value, className }: { value: number; className?: string }) {
    const springValue = useSpring(0, { stiffness: 60, damping: 20, mass: 1 });
    const display = useTransform(springValue, (v) => Math.round(v).toString());
    const [text, setText] = useState('0');

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    useEffect(() => {
        const unsub = display.on('change', (v) => setText(v));
        return unsub;
    }, [display]);

    return <span className={cn('tabular-nums', className)}>{text}</span>;
}

export function FearGreedGauge() {
    const { data, isLoading, error } = useFearGreed();

    if (isLoading) return <SkeletonGauge />;

    if (error || !data) {
        return (
            <HoloCardWrapper intensity={4} glareOpacity={0.06}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Fear &amp; Greed data unavailable</p>
                </div>
            </HoloCardWrapper>
        );
    }

    const { value, classification, timestamp } = data;
    const arcColor = getArcColor(value);
    const colorClass = getClassificationColor(classification);

    return (
        <HoloCardWrapper intensity={4} glareOpacity={0.06}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center mb-4">
                    Fear &amp; Greed Index
                </h3>

                <svg viewBox="0 0 200 120" className="w-full">
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(161,161,170,0.2)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    <AnimatedArc value={value} color={arcColor} />

                    <text
                        x="100"
                        y="78"
                        textAnchor="middle"
                        className={cn('text-3xl font-bold', colorClass)}
                        fill="currentColor"
                    >
                        <AnimatedGaugeValue value={value} />
                    </text>

                    <text
                        x="100"
                        y="98"
                        textAnchor="middle"
                        className="fill-zinc-500 dark:fill-zinc-400 text-xs"
                    >
                        {classification}
                    </text>
                </svg>

                <div className="text-center mt-2">
                    <AnimatedCountUp
                        value={value}
                        className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100"
                    />
                    <span className={cn('ml-2 text-sm font-medium', colorClass)}>/ 100</span>
                </div>

                <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                    Last updated: {formatTimestamp(timestamp)}
                </p>
            </div>
        </HoloCardWrapper>
    );
}
