export function ProfileSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
            {/* Left Column – User Info */}
            <div className="bg-card rounded-2xl shadow-md p-6 overflow-y-auto custom-scrollbar animate-pulse">
                {/* Page title */}
                <div className="h-8 bg-dim rounded-full w-48 mb-2" />
                <div className="h-4 bg-dim rounded-full w-64 mb-6" />

                <div className="bg-subtle rounded-2xl p-6 border-2 border-card-border/30 shadow-inner">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Avatar circle */}
                        <div className="flex flex-col items-center gap-4 flex-shrink-0">
                            <div className="w-44 h-44 rounded-full bg-dim" />
                        </div>

                        {/* Fields */}
                        <div className="flex-1 w-full space-y-5">
                            <div>
                                <div className="h-3 bg-dim rounded-full w-16 mb-2" />
                                <div className="h-6 bg-dim rounded-full w-48" />
                            </div>
                            <div>
                                <div className="h-3 bg-dim rounded-full w-24 mb-2" />
                                <div className="h-6 bg-dim rounded-full w-36" />
                            </div>
                            <div>
                                <div className="h-3 bg-dim rounded-full w-28 mb-2" />
                                <div className="h-6 bg-dim rounded-full w-28" />
                            </div>
                            {/* Button placeholder */}
                            <div className="h-11 bg-dim rounded-xl w-36 mt-2" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-8 h-px bg-dim" />

                    {/* Reading preferences */}
                    <div>
                        <div className="h-6 bg-dim rounded-full w-52 mb-2" />
                        <div className="h-4 bg-dim rounded-full w-72 mb-6" />
                        <div className="flex flex-wrap gap-2">
                            {[80, 64, 96, 72, 56, 88].map((w, i) => (
                                <div key={i} className={`h-8 bg-dim rounded-full`} style={{ width: `${w}px` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column – Books */}
            <div className="bg-card rounded-2xl shadow-md p-6 overflow-y-auto custom-scrollbar flex flex-col animate-pulse">
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
