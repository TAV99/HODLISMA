export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getMonthlySummary, getTransactions } from '@/lib/actions/finance';
import FinanceClient from './FinanceClient';

/**
 * Finance Dashboard Page (Server Component)
 * Fetches initial data and passes to client component
 */
export default async function FinancePage() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Fetch data on the server
    const [summary, transactions] = await Promise.all([
        getMonthlySummary(currentYear, currentMonth),
        getTransactions({ limit: 10 }),
    ]);

    return (
        <FinanceClient
            initialSummary={summary}
            initialTransactions={transactions}
        />
    );
}
