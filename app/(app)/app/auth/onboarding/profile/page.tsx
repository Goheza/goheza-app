import ProfilePageBoundary from '@/components/workspace/boundaryFilters/onboarding/profile'
import { Suspense } from 'react'


export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfilePageBoundary />
        </Suspense>
    )
}
