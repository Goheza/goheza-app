import { useEffect, useState } from 'react'

/**
 * Helper component to handle Dos/Don'ts input and display as a numbered list.
 */
const DosDontsList: React.FC<{
    title: string
    value: string
    onChange: (value: string) => void
    placeholder: string
}> = ({ title, value, onChange, placeholder }) => {
    // Splits the value by new lines to create an array of list items

    const items = value.split('\n').filter((item) => item.trim() !== '')

    // State to toggle between the input mode and the structured list view
    const [isEditing, setIsEditing] = useState(!value) // Start in editing mode if value is empty

    useEffect(() => {
        // Automatically switch to edit mode if the list is empty
        if (!value) {
            setIsEditing(true)
        }
    }, [value])

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm h-full flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
            <div className="flex-grow">
                {' '}
                {/* Allows the content area to expand */}
                {!isEditing && items.length > 0 ? (
                    // Display Mode: Show the formatted numbered list
                    <div className="p-2">
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            {items.map((item, index) => (
                                <li key={index} className="text-gray-800 text-sm">
                                    {item.trim()}
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    // Edit Mode: Show the textarea for editing
                    <textarea
                        rows={6}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-4 py-3 border border-red-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-full"
                    />
                )}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-400">Use new lines (Enter) for 1., 2., 3. formatting.</p>
                {/* Button toggles edit state, or shows 'Save' if editing, or shows 'Add' if empty */}
                <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-1 text-sm rounded-lg transition-colors ${
                        isEditing
                            ? 'bg-[#e85c51] text-white hover:bg-red-700'
                            : 'bg-gray-100 text-red-500 hover:bg-gray-200'
                    }`}
                >
                    {isEditing ? 'Save List' : 'Edit List'}
                </button>
            </div>
        </div>
    )
}

export default DosDontsList;