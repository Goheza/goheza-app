import HeaderItemCreator from '@/components/workspace/common/header/headerCreator'

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <div className=" mb-26">
            <div className="">
                <HeaderItemCreator />
            </div>
            <div className="translate-y-14">{props.children}</div>
        </div>
    )
}
