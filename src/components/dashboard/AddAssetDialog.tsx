'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import type { AssetInput } from '@/lib/types';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

/**
 * Add new asset to Supabase
 */
async function addAsset(data: AssetInput) {
    const { data: result, error } = await supabase
        .from('assets')
        .insert({
            symbol: data.symbol.toUpperCase(),
            name: data.name || data.symbol.toUpperCase(),
            quantity: data.quantity,
            buy_price: data.buy_price,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return result;
}

/**
 * Add Asset Dialog Component
 * Modal form to add new crypto assets to the portfolio
 */
export function AddAssetDialog() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    // Form state
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Mutation hook
    const mutation = useMutation({
        mutationFn: addAsset,
        onSuccess: () => {
            // Invalidate and refetch assets
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            // Close dialog
            setOpen(false);
            // Reset form
            resetForm();
        },
    });

    // Reset form to initial state
    const resetForm = () => {
        setSymbol('');
        setQuantity('');
        setBuyPrice('');
        setErrors({});
        mutation.reset();
    };

    // Handle dialog open change
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            resetForm();
        }
    };

    // Validate form fields
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Symbol validation
        if (!symbol.trim()) {
            newErrors.symbol = 'Symbol is required';
        } else if (!/^[A-Za-z]{2,10}$/.test(symbol.trim())) {
            newErrors.symbol = 'Symbol must be 2-10 letters';
        }

        // Quantity validation
        const qty = parseFloat(quantity);
        if (!quantity.trim()) {
            newErrors.quantity = 'Quantity is required';
        } else if (isNaN(qty) || qty <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }

        // Buy price validation
        const price = parseFloat(buyPrice);
        if (!buyPrice.trim()) {
            newErrors.buyPrice = 'Buy price is required';
        } else if (isNaN(price) || price <= 0) {
            newErrors.buyPrice = 'Price must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        mutation.mutate({
            symbol: symbol.trim().toUpperCase(),
            quantity: parseFloat(quantity),
            buy_price: parseFloat(buyPrice),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        Add a new cryptocurrency to your portfolio. Enter the details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Symbol Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="symbol">
                                Symbol <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="symbol"
                                placeholder="BTC, ETH, SOL..."
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                className={errors.symbol ? 'border-rose-500' : ''}
                                disabled={mutation.isPending}
                            />
                            {errors.symbol && (
                                <p className="text-xs text-rose-500">{errors.symbol}</p>
                            )}
                        </div>

                        {/* Quantity Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">
                                Quantity <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0.5"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className={errors.quantity ? 'border-rose-500' : ''}
                                disabled={mutation.isPending}
                            />
                            {errors.quantity && (
                                <p className="text-xs text-rose-500">{errors.quantity}</p>
                            )}
                        </div>

                        {/* Buy Price Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="buyPrice">
                                Buy Price (USD) <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="buyPrice"
                                type="number"
                                step="any"
                                min="0"
                                placeholder="45000"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                className={errors.buyPrice ? 'border-rose-500' : ''}
                                disabled={mutation.isPending}
                            />
                            {errors.buyPrice && (
                                <p className="text-xs text-rose-500">{errors.buyPrice}</p>
                            )}
                        </div>

                        {/* Mutation Error Display */}
                        {mutation.isError && (
                            <div className="flex items-center gap-2 rounded-md bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{mutation.error.message}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Asset'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
