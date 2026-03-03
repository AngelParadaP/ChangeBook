export function RecommendationSkeleton() {
    return (
        <div className="flex gap-3 animate-pulse">
            <div className="w-12 h-16 rounded-lg bg-dim flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 bg-dim rounded-full w-3/4" />
                <div className="h-2.5 bg-dim rounded-full w-1/2" />
                <div className="h-2 bg-dim rounded-full w-2/3" />
            </div>
        </div>
    );
}
