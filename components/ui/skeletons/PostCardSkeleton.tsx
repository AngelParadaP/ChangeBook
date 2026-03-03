export function PostCardSkeleton() {
    return (
        <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm mb-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-dim" />
                <div className="h-3 bg-dim rounded-full w-28" />
                <div className="h-3 bg-dim rounded-full w-3" />
                <div className="h-3 bg-dim rounded-full w-36" />
                <div className="h-3 bg-dim rounded-full w-3" />
                <div className="h-3 bg-dim rounded-full w-20" />
            </div>
            <div className="space-y-2 mb-3">
                <div className="h-3.5 bg-dim rounded-full w-full" />
                <div className="h-3.5 bg-dim rounded-full w-5/6" />
                <div className="h-3.5 bg-dim rounded-full w-2/3" />
            </div>
            <div className="flex items-center gap-4 border-t border-card-border/50 pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-[18px] h-[18px] rounded bg-dim" />
                    <div className="h-3 bg-dim rounded-full w-6" />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-[18px] h-[18px] rounded bg-dim" />
                    <div className="h-3 bg-dim rounded-full w-20" />
                </div>
            </div>
        </div>
    );
}
