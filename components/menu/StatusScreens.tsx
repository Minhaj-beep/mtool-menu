import { Utensils } from 'lucide-react';
import type { Restaurant } from '@/lib/types/database';

export function UnavailableScreen({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Service Temporarily Unavailable</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          We apologize for the inconvenience. This digital menu is currently unavailable as the subscription may
          have expired or the service is on hold.
        </p>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-16 h-16 rounded-full mx-auto mb-4 object-cover border-2 border-white shadow-md"
            />
          )}
          <p className="text-lg text-slate-900 font-bold mb-2">{restaurant.name}</p>
          <p className="text-sm text-slate-600">
            Please contact the restaurant directly for assistance or visit us in person to view our menu.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MenuNotFoundScreen({ message }: { message: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Utensils className="w-10 h-10 text-slate-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Menu Not Found</h1>
        <p className="text-slate-600 text-lg">{message || 'This menu is not available'}</p>
      </div>
    </div>
  );
}
