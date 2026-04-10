'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            toastOptions={{
                classNames: {
                    description: 'text-foreground/70 text-sm',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--error-bg': 'var(--popover)',
                    '--error-text': 'var(--popover-foreground)',
                    '--error-border': 'var(--destructive)',
                } as React.CSSProperties
            }
            {...props}
        />
    )
}

export { Toaster }
