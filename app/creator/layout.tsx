import HeaderItemMain from "@/components/components/common/header/header";
import HeaderCreator from "@/components/components/creator/header-creator";

export default function RootLayout(props:{children:React.ReactNode}) {
    return (
        <div>
             <HeaderItemMain>
                <HeaderCreator />
            </HeaderItemMain>
            {props.children}
        </div>
    )
}