import { AppLayout } from "@/components/layout/AppLayout";
import { RealtimeListener } from "@/components/providers/RealtimeListener";

export default function AppGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <RealtimeListener />
            <AppLayout>
                {children}
            </AppLayout>
        </>
    );
}
