export function CommunityDetailSkeleton() {
    return (
        <div className="bg-card rounded-2xl shadow-sm h-full overflow-hidden animate-pulse">
            {/* Cover/Header */}
            <div className="relative h-48 bg-dim">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-6">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 rounded-xl bg-white/20" />
                        <div className="flex-1 space-y-2">
                            <div className="h-8 bg-white/20 rounded-lg w-48" />
                            <div className="h-4 bg-white/15 rounded-full w-28" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 border-b border-card-border bg-subtle flex justify-between items-start">
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-dim rounded-full w-3/4" />
                    <div className="h-4 bg-dim rounded-full w-1/2" />
                    <div className="flex gap-1.5 mt-3">
                        <div className="h-5 bg-dim rounded-full w-16" />
                        <div className="h-5 bg-dim rounded-full w-20" />
                        <div className="h-5 bg-dim rounded-full w-14" />
                    </div>
                </div>
                <div className="flex gap-2 ml-4">
                    <div className="h-9 bg-dim rounded-lg w-36" />
                    <div className="h-9 bg-dim rounded-lg w-24" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-card-border">
                <div className="h-9 bg-dim rounded-xl w-32" />
                <div className="h-9 bg-dim rounded-xl w-28" />
            </div>

            {/* Posts Feed */}
            <div className="bg-subtle p-6">
                <div className="flex justify-center gap-6">
                    <div className="w-full max-w-2xl space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card border border-card-border rounded-xl p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-4 h-4 rounded-full bg-dim" />
                                    <div className="h-3 bg-dim rounded-full w-28" />
                                    <div className="h-3 bg-dim rounded-full w-3" />
                                    <div className="h-3 bg-dim rounded-full w-36" />
                                    <div className="h-3 bg-dim rounded-full w-20" />
                                </div>
                                <div className="space-y-2 mb-3">
                                    <div className="h-3.5 bg-dim rounded-full w-full" />
                                    <div className="h-3.5 bg-dim rounded-full w-5/6" />
                                    <div className="h-3.5 bg-dim rounded-full w-2/3" />
                                </div>
                                {i === 0 && (
                                    <div className="mb-3 h-52 rounded-lg bg-dim border border-card-border" />
                                )}
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
