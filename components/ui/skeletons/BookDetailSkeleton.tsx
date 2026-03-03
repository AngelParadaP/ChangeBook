export function BookDetailSkeleton() {
    return (
        <div className="bg-card rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
            <div className="animate-pulse">
                {/* Back button skeleton */}
                <div className="h-10 w-32 bg-dim rounded-xl mb-6" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image skeleton */}
                    <div className="aspect-[2/3] max-h-[500px] bg-dim rounded-2xl" />

                    {/* Info skeleton */}
                    <div className="space-y-6">
                        <div className="h-8 bg-dim rounded-full w-3/4" />
                        <div className="h-5 bg-dim rounded-full w-1/2" />
                        <div className="flex gap-2">
                            <div className="h-8 w-24 bg-dim rounded-full" />
                            <div className="h-8 w-20 bg-dim rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 bg-dim rounded-full w-full" />
                            <div className="h-4 bg-dim rounded-full w-5/6" />
                            <div className="h-4 bg-dim rounded-full w-4/6" />
                        </div>
                        {/* Owner skeleton */}
                        <div className="flex items-center gap-3 p-4 bg-soft rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-dim" />
                            <div className="space-y-2">
                                <div className="h-4 bg-dim rounded-full w-24" />
                                <div className="h-3 bg-dim rounded-full w-16" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
