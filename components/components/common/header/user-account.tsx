/**
 * The User Account Control to be shard by the brand and the creator
 * @returns
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

interface IUserAccountItemOptions {
    signOutUser(): void
}

interface IUserAccountItem extends IUserAccountItemOptions {
    userName: string
    userImageSource:string;
}

export default function UserAccountItem(props: IUserAccountItem) {

    /**
     * 
     * Used to get the first character
     * 
     * @param v 
     * @returns 
     */

    const getFirstCharacter = (v:string) =>{
        return v.charAt(0)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-4">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={props.userImageSource} alt="User" />
                        <AvatarFallback>{getFirstCharacter(props.userName)}</AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
               <DropdownMenuLabel>{props.userName}</DropdownMenuLabel>
                <DropdownMenuItem onClick={props.signOutUser}>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
