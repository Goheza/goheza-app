import HeaderBrand from '@/components/components/brand/header-brand'
import HeaderItemMain from '@/components/components/common/header/header'

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <div >
            <HeaderItemMain>
                <HeaderBrand />
            </HeaderItemMain>
            <div className="translate-y-14 ">{props.children}</div>
        </div>
    )
}
