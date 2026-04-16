import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStatus } from '@sudobility/auth-components';
import { useApi } from '@sudobility/building_blocks/firebase';
import type { Trip } from '@sudobility/superguide_types';
import ScreenContainer from '../components/layout/ScreenContainer';

/**
 * Trip detail loader — fetches one saved trip and hands its itinerary off
 * to the MyTrip view via router state so the rich calendar UI is reused.
 */
export default function HistoryDetailPage() {
  const { user } = useAuthStatus();
  const { networkClient, baseUrl, token } = useApi();
  const { historyId, lang } = useParams<{ historyId: string; lang: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token || !historyId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await networkClient.get(
          `${baseUrl}/api/v1/users/${user.uid}/trips/${historyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const body = res.data as { success: boolean; data?: Trip; error?: string };
        if (cancelled) return;
        if (!body?.success || !body.data) {
          setError(body?.error ?? 'Trip not found.');
          return;
        }
        navigate(`/${lang ?? 'en'}/my-trip`, {
          replace: true,
          state: {
            itin: body.data.itin,
            tripLocation: body.data.location,
          },
        });
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load trip.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, historyId, lang, navigate, networkClient, token, user]);

  return (
    <ScreenContainer>
      <div className="container-app px-4 py-16 text-center">
        {error ? (
          <p className="text-sm" style={{ color: '#B05050' }}>
            {error}
          </p>
        ) : (
          <p className="text-sm" style={{ color: '#A89070' }}>
            Loading your trip…
          </p>
        )}
      </div>
    </ScreenContainer>
  );
}
