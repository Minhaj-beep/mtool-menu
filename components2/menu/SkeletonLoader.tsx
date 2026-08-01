export function SkeletonLoader() {
  return (
    <div className="space-y-6 md:space-y-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <div className="px-6 py-5 md:px-8 md:py-6 bg-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="h-6 bg-slate-200 rounded w-40" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((j) => (
              <div key={j} className="px-6 py-5 md:px-8 md:py-6">
                <div className="flex gap-4 md:gap-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-7 bg-slate-200 rounded-full w-20 mt-2" />
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
