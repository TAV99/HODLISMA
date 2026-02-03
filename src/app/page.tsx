'use client';

import { AssetTable } from '@/components/dashboard/AssetTable';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { usePortfolio } from '@/lib/hooks';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { assets, prices, isLoading } = usePortfolio();

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  HODLISMA
                </h1>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">
                  The Art of Holding
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Portfolio Summary */}
        <section className="mb-10">
          <PortfolioSummary
            assets={assets}
            prices={prices}
            isLoading={isLoading}
          />
        </section>

        {/* Asset Table */}
        <section>
          <AssetTable />
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Design by</span>
            <span className="font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              TAV
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
