export function SkeletonLoader() {
  return (
    <div className="space-y-10 md:space-y-12 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <div className="px-6 py-5 md:px-8 md:py-6 bg-slate-100">
            <div className="h-8 bg-slate-200 rounded w-48" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((j) => (
              <div key={j} className="px-6 py-5 md:px-8 md:py-6">
                <div className="flex gap-4 md:gap-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
