import { useCallback, useState } from 'react';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRestaurantsManager } from '@sudobility/superguide_lib';
import type { Restaurant } from '@sudobility/superguide_types';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import ScreenContainer from '../components/layout/ScreenContainer';

export default function EatsPage() {
  const { networkClient, baseUrl } = useApi();

  const [dishInput, setDishInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [dish, setDish] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);

  const { restaurants, isLoading, error, isCached, refresh } =
    useRestaurantsManager({ baseUrl, networkClient, dish, location });

  const canSearch = !!dishInput.trim() && !!locationInput.trim() && !isLoading;

  const handleSearch = useCallback(() => {
    const d = dishInput.trim();
    const l = locationInput.trim();
    if (!d || !l) return;
    setDish(d);
    setLocation(l);
  }, [dishInput, locationInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canSearch) handleSearch();
    },
    [canSearch, handleSearch]
  );

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#2A1F0E' }}>
              Find Restaurants
            </h1>
            <p className="text-sm" style={{ color: '#A89070' }}>
              Tell us the dish and we'll find the best spots.
            </p>
          </div>

          {/* Search form */}
          <div className="space-y-3 mb-4">
            <div className="sg-card p-5">
              <label
                htmlFor="dish-input"
                className="block text-xs font-bold tracking-widest mb-3"
                style={{ color: '#A89070', letterSpacing: '0.12em' }}
              >
                DISH
              </label>
              <input
                id="dish-input"
                type="text"
                value={dishInput}
                onChange={e => setDishInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. ramen"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: '#FFFDF7',
                  border: '1px solid rgba(90,70,40,0.15)',
                  color: '#2A1F0E',
                }}
              />
            </div>

            <div className="sg-card p-5">
              <label
                htmlFor="location-input"
                className="block text-xs font-bold tracking-widest mb-3"
                style={{ color: '#A89070', letterSpacing: '0.12em' }}
              >
                LOCATION
              </label>
              <input
                id="location-input"
                type="text"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Tokyo"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: '#FFFDF7',
                  border: '1px solid rgba(90,70,40,0.15)',
                  color: '#2A1F0E',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={!canSearch}
              className="sg-btn w-full py-4 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-label="Loading"
                />
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Cached pill */}
          {isCached && (
            <div className="flex justify-center mb-4">
              <span
                className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(90,70,40,0.07)',
                  border: '1px solid rgba(90,70,40,0.12)',
                  color: '#7A6A50',
                  letterSpacing: '0.12em',
                }}
              >
                CACHED RESULTS
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="sg-card p-4 mb-4 text-center"
              style={{ borderColor: 'rgba(192,80,80,0.25)' }}
            >
              <p className="text-sm" style={{ color: '#B05050' }}>
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {restaurants.length > 0 ? (
            <ul className="space-y-3 mt-6">
              {restaurants.map((r: Restaurant, idx: number) => (
                <li key={`${r.restaurantname}-${idx}`}>
                  <RestaurantCard restaurant={r} onRefresh={refresh} />
                </li>
              ))}
            </ul>
          ) : !isLoading && dish ? (
            <p className="text-center text-sm mt-10" style={{ color: '#A89070' }}>
              No restaurants found.
            </p>
          ) : null}
        </div>
      </div>
    </ScreenContainer>
  );
}

function RestaurantCard({
  restaurant,
}: {
  restaurant: Restaurant;
  onRefresh: () => void;
}) {
  return (
    <div className="sg-card p-5 flex items-start gap-4">
      <div
        className="shrink-0 flex items-center justify-center rounded-xl w-10 h-10"
        style={{ background: 'rgba(107,122,78,0.1)' }}
      >
        <BuildingStorefrontIcon className="w-5 h-5" style={{ color: '#6B7A4E' }} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#2A1F0E' }}>
          {restaurant.restaurantname}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#A89070' }}>
          {restaurant.address}
        </p>
      </div>
    </div>
  );
}
