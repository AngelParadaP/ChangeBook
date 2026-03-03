export function UserCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border-2 border-card-border p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-dim" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-dim rounded-full w-32" />
                    <div className="h-3 bg-dim rounded-full w-24" />
                    <div className="h-3 bg-dim rounded-full w-28" />
                </div>
            </div>
            <div className="flex gap-1">
                <div className="h-5 bg-dim rounded-full w-16" />
                <div className="h-5 bg-dim rounded-full w-20" />
                <div className="h-5 bg-dim rounded-full w-14" />
            </div>
        </div>
    );
}
