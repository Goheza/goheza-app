export function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="text-sm text-gray-600">{title}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
            {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
        </div>
    )
}
