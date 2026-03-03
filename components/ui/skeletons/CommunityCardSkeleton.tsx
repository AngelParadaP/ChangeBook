export function CommunityCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border-2 border-card-border p-5 animate-pulse">
            <div className="flex items-start gap-4 mb-3">
                <div className="w-16 h-16 rounded-xl bg-dim flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-dim rounded-full w-3/4" />
                    <div className="h-3 bg-dim rounded-full w-24" />
                    <div className="h-4 bg-dim rounded-full w-16" />
                </div>
            </div>
            <div className="space-y-1.5 mb-4">
                <div className="h-3 bg-dim rounded-full w-full" />
                <div className="h-3 bg-dim rounded-full w-2/3" />
            </div>
            <div className="h-9 bg-dim rounded-lg" />
        </div>
    );
}
