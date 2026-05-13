'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpiredLink, setIsExpiredLink] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsExpiredLink(false);

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
        const { error: authError } = await supabase.auth.updateUser({ password });

        if (authError) {
            const msg = authError.message.toLowerCase();
            if (
                msg.includes('expired') ||
                msg.includes('invalid') ||
                msg.includes('token')
            ) {
                setIsExpiredLink(true);
                setError('Link đã hết hạn');
            } else {
                setError(authError.message);
            }
        } else {
            setSuccessMessage('Đã đặt mật khẩu mới thành công');
            setTimeout(() => router.push('/'), 2000);
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
                    <p className="text-zinc-400 mt-2">Đặt mật khẩu mới</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                        {isExpiredLink && (
                            <>
                                {' — '}
                                <Link
                                    href="/forgot-password"
                                    className="text-indigo-400 hover:text-indigo-300 underline transition"
                                >
                                    Yêu cầu lại
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Mật khẩu mới"
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
                        {loading ? 'Đang cập nhật...' : 'Đặt mật khẩu mới'}
                    </button>
                </form>
            </div>
        </div>
    );
}
