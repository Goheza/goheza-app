'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PostConfirmDialogProps {
    isOpen: boolean
    creatorName: string
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
}

const TikTokIcon = () => (
    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.22 8.22 0 004.79 1.52V6.81a4.85 4.85 0 01-1.02-.12z" />
        </svg>
    </div>
)

export default function PostConfirmDialog({
    isOpen,
    creatorName,
    onConfirm,
    onCancel,
    isLoading = false,
}: PostConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <TikTokIcon />
                        <DialogTitle className="text-xl">Post to TikTok</DialogTitle>
                    </div>
                    <DialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Are you sure you want to post this video?</p>
                            <p>
                                This video will be published directly on{' '}
                                <span className="font-semibold text-foreground">{creatorName}</span>'s TikTok account.
                                This action cannot be undone once posted.
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-amber-800 text-sm font-medium">
                        ⚠️ The creator's TikTok account will reflect this post publicly and immediately.
                    </p>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full bg-black text-white hover:bg-gray-800"
                    >
                        {isLoading ? 'Posting...' : 'Yes, Post to TikTok'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}