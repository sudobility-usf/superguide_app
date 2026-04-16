import { useMemo } from 'react';
import { useAuthStatus } from '@sudobility/auth-components';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useSavedTripsManager } from '@sudobility/superguide_lib';
import { useNavigate, useParams } from 'react-router-dom';
import ScreenContainer from '../components/layout/ScreenContainer';
import LocalizedLink from '../components/layout/LocalizedLink';
import type { Trip } from '@sudobility/superguide_types';

/**
 * My Trips — lists saved trips for the authenticated user. Clicking one
 * navigates to `/my-trip` with the stored itinerary as router state, so the
 * existing MyTrip calendar view renders without modification.
 */
export default function HistoriesPage() {
  const { user } = useAuthStatus();
  const { networkClient, baseUrl, token } = useApi();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();

  const { trips, isLoading, error, deleteTrip } = useSavedTripsManager({
    baseUrl,
    networkClient,
    userId: user?.uid ?? null,
    token: token ?? null,
  });

  const sortedTrips = useMemo(
    () =>
      [...trips].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [trips]
  );

  if (!user) {
    return (
      <ScreenContainer>
        <div className="container-app px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-bold mb-3" style={{ color: '#2A1F0E' }}>
            My Trips
          </h1>
          <p className="text-sm mb-8" style={{ color: '#A89070' }}>
            Sign in to see the trips you've generated.
          </p>
          <LocalizedLink to="/login">
            <button className="sg-btn px-8 py-3.5 text-sm">Sign In</button>
          </LocalizedLink>
        </div>
      </ScreenContainer>
    );
  }

  const handleOpen = (trip: Trip) => {
    navigate(`/${lang ?? 'en'}/my-trip`, {
      state: { itin: trip.itin, tripLocation: trip.location },
    });
  };

  const handleDelete = async (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Remove "${trip.location}" from your saved trips?`))
      return;
    try {
      await deleteTrip(trip.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-1" style={{ color: '#2A1F0E' }}>
              My Trips
            </h1>
            <p className="text-sm" style={{ color: '#A89070' }}>
              Trips you've generated
            </p>
          </div>

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

          {isLoading && sortedTrips.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#A89070' }}>
                Loading…
              </p>
            </div>
          ) : sortedTrips.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm mb-6" style={{ color: '#A89070' }}>
                No trips yet.
              </p>
              <LocalizedLink to="/get-started">
                <button className="sg-btn px-8 py-3.5 text-sm">
                  Plan a Trip
                </button>
              </LocalizedLink>
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedTrips.map(trip => {
                const days = trip.itin.length;
                const stops = trip.itin.reduce(
                  (sum, d) => sum + (d.schedule?.length ?? 0),
                  0
                );
                const range = `${formatDay(trip.start_date)} – ${formatDay(trip.end_date)}`;
                return (
                  <li key={trip.id}>
                    <button
                      type="button"
                      onClick={() => handleOpen(trip)}
                      className="sg-card w-full text-left p-5 transition-transform hover:scale-[1.01]"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span
                          className="text-lg font-semibold truncate"
                          style={{ color: '#2A1F0E' }}
                        >
                          {trip.location}
                        </span>
                        <span
                          className="text-xs font-semibold shrink-0"
                          style={{ color: '#7A6A50' }}
                        >
                          {range}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs" style={{ color: '#A89070' }}>
                          {days} {days === 1 ? 'day' : 'days'} · {stops} stops
                        </span>
                        <button
                          type="button"
                          onClick={e => handleDelete(e, trip)}
                          className="text-xs font-medium"
                          style={{ color: '#B05050', cursor: 'pointer' }}
                          aria-label={`Delete trip to ${trip.location}`}
                        >
                          Delete
                        </button>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}

function formatDay(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
