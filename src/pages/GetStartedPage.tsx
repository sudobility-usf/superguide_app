import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useApi } from '@sudobility/building_blocks/firebase';

interface PlaceSuggestion {
  display_name: string;
  place_id: number;
}

function LocationAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city`
        );
        setSuggestions(await res.json());
        setOpen(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(s: PlaceSuggestion) {
    const short = s.display_name.split(', ').slice(0, 3).join(', ');
    setQuery(short); onChange(short);
    setSuggestions([]); setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id="location"
        className="sg-input"
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="e.g. San Francisco"
        autoComplete="off"
        required
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 sg-card py-1 overflow-hidden" style={{ borderRadius: 14 }}>
          {suggestions.map(s => (
            <li
              key={s.place_id}
              onMouseDown={() => select(s)}
              className="px-4 py-2.5 text-sm cursor-pointer truncate transition-colors"
              style={{ color: '#7A6A50' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(90,70,40,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GetStartedPage() {
  const [location, setLocation] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { baseUrl } = useApi();

  const numDays = range?.from && range?.to
    ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!range?.from || !range?.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/v1/trips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          start_date: range.from.toISOString().split('T')[0],
          end_date: range.to.toISOString().split('T')[0],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      navigate(`/${lang ?? 'en'}/my-trip`, {
        state: { itin: data.data.itin, tripLocation: location },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#2A1F0E' }}>Plan Your Trip</h1>
            <p className="text-sm" style={{ color: '#A89070' }}>Tell us where you're going and when.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Destination */}
            <div className="sg-card p-6">
              <label htmlFor="location" className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
                style={{ color: '#A89070' }}>
                Destination
              </label>
              <LocationAutocomplete value={location} onChange={setLocation} />
            </div>

            {/* Dates */}
            <div className="sg-card p-6">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
                style={{ color: '#A89070' }}>
                Travel Dates
              </label>

              {/* Date range summary */}
              {range?.from && range?.to ? (
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  <span className="sg-pill px-3 py-1 text-xs" style={{ color: '#7A6A50' }}>
                    {range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-sm" style={{ color: '#C0B090' }}>→</span>
                  <span className="sg-pill px-3 py-1 text-xs" style={{ color: '#7A6A50' }}>
                    {range.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="sg-pill px-3 py-1 text-xs font-semibold" style={{ color: '#6B7A4E' }}>
                    {numDays} {numDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              ) : (
                <p className="text-xs mb-5" style={{ color: '#C0B090' }}>Select your start and end dates below.</p>
              )}

              <div className="overflow-x-auto">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  disabled={{ before: new Date() }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!location || !range?.from || !range?.to || loading}
              className="sg-btn w-full py-4"
            >
              {loading ? 'Generating your itinerary…' : 'Generate My Itinerary'}
            </button>
          </form>

          {error && (
            <div className="mt-4 sg-card p-4 text-center" style={{ borderColor: 'rgba(192,80,80,0.25)' }}>
              <p className="text-sm" style={{ color: '#B05050' }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
