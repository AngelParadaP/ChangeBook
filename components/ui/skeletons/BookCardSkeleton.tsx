export function BookCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border-2 border-card-border p-4 animate-pulse">
            <div className="aspect-[2/3] bg-dim rounded-xl mb-3" />
            <div className="space-y-2">
                <div className="h-4 bg-dim rounded-full w-3/4" />
                <div className="h-3 bg-dim rounded-full w-1/2" />
                <div className="flex gap-1 mt-2">
                    <div className="h-5 bg-dim rounded-full w-16" />
                    <div className="h-5 bg-dim rounded-full w-12" />
                </div>
            </div>
        </div>
    );
}
