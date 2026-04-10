// app/auth/onboarding/profile/page.tsx

import ConnectedAccountsPageBoundary from '@/components/workspace/boundaryFilters/creators/connectedAccount'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConnectedAccountsPageBoundary/>
        </Suspense>
    )
}
