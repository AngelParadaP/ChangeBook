export function ProfileSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
            {/* Left Column – User Info */}
            <div className="bg-card rounded-2xl shadow-md p-4 sm:p-6 overflow-y-auto custom-scrollbar animate-pulse">
                {/* Page title */}
                <div className="h-7 sm:h-8 bg-dim rounded-full w-40 sm:w-48 mb-2" />
                <div className="h-3 sm:h-4 bg-dim rounded-full w-56 sm:w-64 mb-5 sm:mb-6" />

                <div className="bg-subtle rounded-2xl p-4 sm:p-6 border-2 border-card-border/30 shadow-inner">
                    {/* Avatar + fields: stacked on mobile, row on md+ */}
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center">
                        {/* Avatar circle */}
                        <div className="flex flex-col items-center gap-4 flex-shrink-0">
                            <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-dim" />
                        </div>

                        {/* Fields */}
                        <div className="flex-1 w-full space-y-4 sm:space-y-5">
                            <div>
                                <div className="h-3 bg-dim rounded-full w-16 mb-1.5" />
                                <div className="h-5 sm:h-6 bg-dim rounded-full w-40 sm:w-48" />
                            </div>
                            <div>
                                <div className="h-3 bg-dim rounded-full w-24 mb-1.5" />
                                <div className="h-5 sm:h-6 bg-dim rounded-full w-32 sm:w-36" />
                            </div>
                            <div>
                                <div className="h-3 bg-dim rounded-full w-28 mb-1.5" />
                                <div className="h-5 sm:h-6 bg-dim rounded-full w-24 sm:w-28" />
                            </div>
                            {/* Button placeholder */}
                            <div className="h-10 sm:h-11 bg-dim rounded-xl w-32 sm:w-36 mt-1" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-5 sm:my-8 h-px bg-dim" />

                    {/* Reading preferences */}
                    <div>
                        <div className="h-5 sm:h-6 bg-dim rounded-full w-44 sm:w-52 mb-2" />
                        <div className="h-3 sm:h-4 bg-dim rounded-full w-60 sm:w-72 mb-4 sm:mb-6" />
                        <div className="flex flex-wrap gap-2">
                            {[80, 64, 96, 72, 56, 88].map((w, i) => (
                                <div key={i} className="h-7 sm:h-8 bg-dim rounded-full" style={{ width: `${w}px` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column – Books (hidden on mobile, only visible on lg+) */}
            <div className="hidden lg:flex bg-card rounded-2xl shadow-md p-6 overflow-y-auto custom-scrollbar flex-col animate-pulse">
                <div className="h-7 bg-dim rounded-full w-48 mb-6" />
                {/* Book card skeletons */}
                <div className="space-y-4 flex-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-3 bg-subtle rounded-2xl border border-card-border/30">
                            <div className="w-14 h-20 rounded-xl bg-dim flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-dim rounded-full w-3/4" />
                                <div className="h-3 bg-dim rounded-full w-1/2" />
                                <div className="flex gap-1 mt-3">
                                    <div className="h-5 bg-dim rounded-full w-16" />
                                    <div className="h-5 bg-dim rounded-full w-14" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

