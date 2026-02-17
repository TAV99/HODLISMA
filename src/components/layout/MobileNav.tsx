'use client';

import * as React from 'react';
import Link from 'next/link';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavContent } from './NavContent';
import { Button } from '@/components/ui/button';

export function MobileNav() {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    HODLISMA
                </span>
            </Link>

            {/* Hamburger Menu */}
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
                <DialogPrimitive.Trigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </DialogPrimitive.Trigger>

                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm gap-4 bg-slate-950 p-0 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full duration-200 border-r border-white/10",
                        )}
                    >
                        <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>
                        <DialogPrimitive.Description className="sr-only">
                            Main navigation for mobile devices
                        </DialogPrimitive.Description>
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-end p-4">
                                <DialogPrimitive.Close asChild>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                        <X className="h-5 w-5" />
                                        <span className="sr-only">Close</span>
                                    </Button>
                                </DialogPrimitive.Close>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto">
                                <NavContent collapsed={false} onNavigate={() => setOpen(false)} />
                            </div>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
}
