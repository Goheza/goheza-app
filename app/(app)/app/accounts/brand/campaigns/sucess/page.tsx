import PostSuccessPageBoundary from '@/components/workspace/boundaryFilters/campaignsSuccess/postSuccess'
import { Suspense } from 'react'


export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PostSuccessPageBoundary/>
        </Suspense>
    )
}
