export function ProfileSkeleton() {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar pb-8">
            {/* Profile Card Skeleton */}
            <div className="bg-card rounded-2xl shadow-md overflow-hidden animate-pulse">
                {/* Banner */}
                <div className="h-28 sm:h-36 bg-dim" />

                <div className="px-4 sm:px-6 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        {/* Avatar + name — centered mobile */}
                        <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-16">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-soft ring-4 ring-card flex-shrink-0" />
                            <div className="text-center sm:text-left sm:pb-2 space-y-2">
                                <div className="h-6 sm:h-7 bg-dim rounded-full w-36 sm:w-48 mx-auto sm:mx-0" />
                                <div className="h-3.5 bg-dim rounded-full w-24 mx-auto sm:mx-0" />
                            </div>
                        </div>
                        {/* Button — desktop only */}
                        <div className="hidden sm:flex gap-2 sm:pb-2">
                            <div className="h-9 w-28 bg-dim rounded-xl" />
                        </div>
                    </div>

                    {/* Mobile button */}
                    <div className="sm:hidden flex justify-center mt-1">
                        <div className="h-9 w-28 bg-dim rounded-xl" />
                    </div>

                    {/* Info chips — centered on mobile */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <div className="h-6 w-28 bg-dim rounded-full" />
                        <div className="h-6 w-36 bg-dim rounded-full" />
                        <div className="h-6 w-24 bg-dim rounded-full" />
                        <div className="h-6 w-20 bg-dim rounded-full" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-card-border px-4 sm:px-6">
                    <div className="flex gap-1 py-0.5">
                        <div className="h-10 w-24 bg-dim rounded-t-lg" />
                        <div className="h-10 w-24 bg-dim/50 rounded-t-lg" />
                        <div className="h-10 w-28 bg-dim/30 rounded-t-lg" />
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="mt-4 bg-card rounded-2xl shadow-md p-4 sm:p-6 animate-pulse">
                <div className="h-6 bg-dim rounded-full w-40 mb-5" />
                <div className="h-10 bg-dim rounded-xl w-full mb-5" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-3 bg-subtle rounded-2xl border border-card-border/30">
                            <div className="w-16 h-24 rounded-xl bg-dim flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-dim rounded-full w-3/4" />
                                <div className="h-3 bg-dim rounded-full w-1/2" />
                                <div className="flex gap-1 mt-3">
                                    <div className="h-5 bg-dim rounded-full w-16" />
                                    <div className="h-5 bg-dim rounded-full w-14" />
                                    <div className="h-5 bg-dim rounded-full w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
