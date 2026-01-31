'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAsset } from '@/lib/hooks';
import type { Asset } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';

interface EditAssetDialogProps {
    asset: Asset;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Edit Asset Dialog Component
 * Modal form to edit existing crypto assets
 */
export function EditAssetDialog({ asset, open, onOpenChange }: EditAssetDialogProps) {
    // Form state
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Update mutation
    const updateMutation = useUpdateAsset();

    // Initialize form with asset values when dialog opens
    useEffect(() => {
        if (open && asset) {
            setQuantity(asset.quantity.toString());
            setBuyPrice(asset.buy_price.toString());
            setErrors({});
            updateMutation.reset();
        }
    }, [open, asset]);

    // Validate form fields
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

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

        updateMutation.mutate(
            {
                id: asset.id,
                data: {
                    quantity: parseFloat(quantity),
                    buy_price: parseFloat(buyPrice),
                },
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                    <DialogDescription>
                        Update <span className="font-semibold text-indigo-600">{asset.symbol.toUpperCase()}</span> holdings.
                        Symbol cannot be changed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Symbol Display (Read-only) */}
                        <div className="grid gap-2">
                            <Label htmlFor="symbol" className="text-zinc-500">
                                Symbol
                            </Label>
                            <Input
                                id="symbol"
                                value={asset.symbol.toUpperCase()}
                                disabled
                                className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                            />
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
                                disabled={updateMutation.isPending}
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
                                disabled={updateMutation.isPending}
                            />
                            {errors.buyPrice && (
                                <p className="text-xs text-rose-500">{errors.buyPrice}</p>
                            )}
                        </div>

                        {/* Mutation Error Display */}
                        {updateMutation.isError && (
                            <div className="flex items-center gap-2 rounded-md bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{updateMutation.error.message}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
