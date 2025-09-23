import HeaderItemMainCre from '@/components/components/common/header/header-cre'

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <div  className=' mb-26'>
            <div className=''>
               <HeaderItemMainCre/>
            </div>

            <div className="translate-y-14">{props.children}</div>
        </div>
    )
}
