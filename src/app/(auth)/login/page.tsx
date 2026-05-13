'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
}

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlError = searchParams.get('error');

    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    function switchTab(tab: 'signin' | 'signup') {
        setActiveTab(tab);
        setError('');
        setSuccessMessage('');
    }

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            router.push('/');
        }
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 6) {
            setError('Mật khẩu tối thiểu 6 ký tự');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        setLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
        } else {
            setSuccessMessage('Kiểm tra email để xác nhận tài khoản');
        }

        setLoading(false);
    }

    const inputClassName =
        'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-400';

    return (
        <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        HODLISMA
                    </h1>
                    <p className="text-zinc-400 mt-2">Đăng nhập để tiếp tục</p>
                </div>

                {urlError && (
                    <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {decodeURIComponent(urlError)}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                        {successMessage}
                    </div>
                )}

                <div className="flex mb-6 border-b border-zinc-700">
                    <button
                        type="button"
                        onClick={() => switchTab('signin')}
                        className={`flex-1 pb-3 text-sm font-medium transition cursor-pointer ${
                            activeTab === 'signin'
                                ? 'border-b-2 border-indigo-400 text-white'
                                : 'text-zinc-500'
                        }`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab('signup')}
                        className={`flex-1 pb-3 text-sm font-medium transition cursor-pointer ${
                            activeTab === 'signup'
                                ? 'border-b-2 border-indigo-400 text-white'
                                : 'text-zinc-500'
                        }`}
                    >
                        Đăng ký
                    </button>
                </div>

                {activeTab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputClassName}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={inputClassName}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-3 w-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                        <div className="text-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </form>
                )}

                {activeTab === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputClassName}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={inputClassName}
                        />
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={inputClassName}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-3 w-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                        </button>
                    </form>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-zinc-500 bg-[rgba(255,255,255,0.05)]">hoặc</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleOAuth('google')}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 cursor-pointer"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Đăng nhập với Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleOAuth('github')}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 cursor-pointer"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        Đăng nhập với GitHub
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
