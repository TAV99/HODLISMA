export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-zinc-950 flex items-center justify-center px-4">
            {children}
        </div>
    );
}
