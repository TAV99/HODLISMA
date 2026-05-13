import { getAuditLogs } from '@/lib/actions/audit';
import { ActivityFeed } from '@/components/history/ActivityFeed';
import { Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const logs = await getAuditLogs({ limit: 50 });

    return (
        <div className="min-h-screen gradient-bg">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Lịch sử hoạt động
                        </h1>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Theo dõi mọi thay đổi trên Crypto và Personal Finance. Rollback khi cần.
                    </p>
                </header>

                {/* Activity Feed */}
                <ActivityFeed initialLogs={logs} />
            </div>
        </div>
    );
}
