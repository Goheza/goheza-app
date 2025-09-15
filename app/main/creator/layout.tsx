import HeaderItemMain from '@/components/components/common/header/header'
import HeaderCreator from '@/components/components/creator/header-creator'

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <div  className=' mb-26'>
            <div className=''>
                <HeaderItemMain>
                    <HeaderCreator />
                </HeaderItemMain>
            </div>

            <div className="translate-y-14">{props.children}</div>
        </div>
    )
}
