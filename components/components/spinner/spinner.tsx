/**
 * UI Spinner
 * @returns
 */

interface IUSpinner {
    willSpin: boolean
}

export default function Spinner(props: IUSpinner) {
    return (
        <div
            className={`${
                props.willSpin ? 'animate-spin' : 'hidden'
            } w-12 h-12 border-4 border-[#E66262] border-t-transparent rounded-full `}
        ></div>
    )
}
