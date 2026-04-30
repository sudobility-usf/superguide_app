import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ScheduleItem, ItinDay } from '@sudobility/superguide_types';
import { parseTime, formatTime12, formatHour } from '@sudobility/superguide_lib';
import ScreenContainer from '../components/layout/ScreenContainer';
import TransitMap from '../components/TransitMap';

// ── Calendar helpers ─────────────────────────────────────────

function parseEventDates(date: string, startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date(`${date}T00:00:00`);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(`${date}T00:00:00`);
  end.setHours(eh, em, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function fmtIso(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
}

function buildGoogleCalendarUrl(item: ScheduleItem, date: string): string {
  const { start, end } = parseEventDates(date, item.start_time, item.end_time);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.name,
    dates: `${fmtIso(start)}/${fmtIso(end)}`,
    location: item.location,
    ...(item.type === 'restaurant' && item.meal ? { details: `${item.meal} stop` } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(itin: ItinDay[], tripLocation: string): string {
  const stamp = fmtIso(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Superguide//EN',
    `X-WR-CALNAME:${tripLocation}`,
  ];
  for (const day of itin) {
    for (const item of day.schedule) {
      const { start, end } = parseEventDates(day.date, item.start_time, item.end_time);
      const uid = `${day.date}-${item.start_time.replace(':', '')}-${Math.random().toString(36).slice(2)}@superguide`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${fmtIso(start)}`,
        `DTEND:${fmtIso(end)}`,
        `SUMMARY:${item.name}`,
        `LOCATION:${item.location}`,
        ...(item.type === 'restaurant' && item.meal ? [`DESCRIPTION:${item.meal} stop`] : []),
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadIcs(itin: ItinDay[], tripLocation: string) {
  const content = buildIcs(itin, tripLocation);
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tripLocation.replace(/[^a-zA-Z0-9]/g, '_')}_trip.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

async function openAllInGoogleCalendar(itin: ItinDay[]) {
  const allItems: Array<{ item: ScheduleItem; date: string }> = [];
  for (const day of itin) {
    for (const item of day.schedule) allItems.push({ item, date: day.date });
  }
  for (const { item, date } of allItems) {
    window.open(buildGoogleCalendarUrl(item, date), '_blank');
    await new Promise(r => setTimeout(r, 400));
  }
}

const HOUR_HEIGHT = 64;
const CALENDAR_START = 7;
const CALENDAR_END = 23;
const HOURS = Array.from({ length: CALENDAR_END - CALENDAR_START }, (_, i) => CALENDAR_START + i);

interface SelectedEvent {
  item: ScheduleItem;
  dayLabel: string;
  prevItem: ScheduleItem | null;
  nextItem: ScheduleItem | null;
}

export default function MyTrip() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { itin: ItinDay[]; tripLocation: string } | null;
  const [selected, setSelected] = useState<SelectedEvent | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const [calMenuOpen, setCalMenuOpen] = useState(false);
  const [addingToGcal, setAddingToGcal] = useState(false);
  const calMenuRef = useRef<HTMLDivElement>(null);

  if (!state?.itin) {
    return (
      <ScreenContainer>
        <div className="container-app px-4 py-16 text-center">
          <p className="text-sm mb-6" style={{ color: '#A89070' }}>No trip data found.</p>
          <button onClick={() => navigate(-1)} className="sg-btn px-8 py-3">
            Go Back
          </button>
        </div>
      </ScreenContainer>
    );
  }

  const { itin, tripLocation } = state;

  const handleGoogleCalendar = useCallback(async () => {
    setCalMenuOpen(false);
    setAddingToGcal(true);
    try { await openAllInGoogleCalendar(itin); } finally { setAddingToGcal(false); }
  }, [itin]);

  const handleDownloadIcs = useCallback(() => {
    setCalMenuOpen(false);
    downloadIcs(itin, tripLocation);
  }, [itin, tripLocation]);
  const totalHeight = (CALENDAR_END - CALENDAR_START) * HOUR_HEIGHT;

  // Chunk itinerary into weeks of 7
  const weeks: ItinDay[][] = [];
  for (let i = 0; i < itin.length; i += 7) weeks.push(itin.slice(i, i + 7));
  const currentWeek = weeks[weekIndex] ?? [];
  const totalWeeks = weeks.length;

  const isRest = selected?.item.type === 'restaurant';
  const detailBg     = isRest ? '#EDD9B0' : '#D4DCBA';
  const detailAccent = isRest ? '#C07A2E' : '#6B7A4E';
  const detailName   = isRest ? '#7A3C10' : '#2A4A1E';
  const detailSub    = isRest ? '#C07A2E' : '#6B7A4E';

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#2A1F0E' }}>Your Trip</h1>
          {tripLocation && <p className="text-sm" style={{ color: '#A89070' }}>{tripLocation}</p>}
        </div>

        {/* Legend + week nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="sg-pill px-4 py-1.5 flex items-center gap-2 text-xs" style={{ color: '#7A6A50' }}>
              <span className="w-2 h-2 rounded-full block" style={{ background: '#6B7A4E' }} />
              Activity
            </div>
            <div className="sg-pill px-4 py-1.5 flex items-center gap-2 text-xs" style={{ color: '#7A6A50' }}>
              <span className="w-2 h-2 rounded-full block" style={{ background: '#C07A2E' }} />
              Restaurant
            </div>
          </div>

          {totalWeeks > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setWeekIndex(w => w - 1); setSelected(null); }}
                disabled={weekIndex === 0}
                className="sg-pill w-8 h-8 flex items-center justify-center text-sm transition-opacity"
                style={{ color: '#7A6A50', opacity: weekIndex === 0 ? 0.35 : 1, cursor: weekIndex === 0 ? 'not-allowed' : 'pointer' }}
              >
                ‹
              </button>
              <span className="text-xs font-semibold tabular-nums" style={{ color: '#A89070' }}>
                Week {weekIndex + 1} / {totalWeeks}
              </span>
              <button
                onClick={() => { setWeekIndex(w => w + 1); setSelected(null); }}
                disabled={weekIndex === totalWeeks - 1}
                className="sg-pill w-8 h-8 flex items-center justify-center text-sm transition-opacity"
                style={{ color: '#7A6A50', opacity: weekIndex === totalWeeks - 1 ? 0.35 : 1, cursor: weekIndex === totalWeeks - 1 ? 'not-allowed' : 'pointer' }}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Calendar + Detail panel */}
        <div className="flex gap-4 items-start">

          {/* Calendar — slides left when an event is selected */}
          <div
            style={{
              flex: selected ? '0 0 62%' : '1 1 100%',
              minWidth: 0,
              transition: 'flex-basis 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div className="sg-card p-5">
              <div className="flex w-full">

                {/* Hour column */}
                <div className="w-14 shrink-0 relative" style={{ height: totalHeight }}>
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute w-full pr-2 text-right text-[11px] tabular-nums"
                      style={{ top: (h - CALENDAR_START) * HOUR_HEIGHT - 8, color: '#C0B090' }}
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {currentWeek.map(day => {
                  const label = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  });

                  return (
                    <div key={day.day} className="flex flex-col shrink-0" style={{ flex: '1 1 0', minWidth: '10rem' }}>
                      {/* Day header */}
                      <div className="text-center text-[11px] font-semibold uppercase tracking-wider py-3 mb-1"
                        style={{ color: '#A89070', borderBottom: '1px solid rgba(90,70,40,0.10)' }}>
                        {label}
                      </div>

                      {/* Events */}
                      <div
                        className="relative"
                        style={{ height: totalHeight, borderLeft: '1px solid rgba(90,70,40,0.08)' }}
                      >
                        {/* Hour grid lines */}
                        {HOURS.map(h => (
                          <div
                            key={h}
                            className="absolute w-full"
                            style={{ top: (h - CALENDAR_START) * HOUR_HEIGHT, borderTop: '1px solid rgba(90,70,40,0.06)' }}
                          />
                        ))}

                        {/* Schedule items */}
                        {day.schedule.map((item, i) => {
                          const start  = parseTime(item.start_time);
                          const end    = parseTime(item.end_time);
                          const top    = (start - CALENDAR_START) * HOUR_HEIGHT;
                          const height = Math.max((end - start) * HOUR_HEIGHT, 28);
                          const itemIsRest = item.type === 'restaurant';
                          const cls        = itemIsRest ? 'sg-event-restaurant' : 'sg-event-activity';
                          const nameColor  = itemIsRest ? '#7A3C10' : '#2A4A1E';
                          const subColor   = itemIsRest ? '#C07A2E' : '#6B7A4E';
                          const isActive   = selected?.item === item;

                          return (
                            <div
                              key={i}
                              className={cls}
                              style={{
                                top,
                                height,
                                cursor: 'pointer',
                                outline: isActive ? `2px solid ${itemIsRest ? '#C07A2E' : '#6B7A4E'}` : 'none',
                                outlineOffset: 1,
                              }}
                              onClick={() => setSelected(isActive ? null : {
                                item,
                                dayLabel: label,
                                prevItem: i > 0 ? day.schedule[i - 1] : null,
                                nextItem: i < day.schedule.length - 1 ? day.schedule[i + 1] : null,
                              })}
                            >
                              <div className="px-2.5 py-1.5">
                                <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: nameColor }}>
                                  {item.name}
                                </p>
                                {height > 38 && (
                                  <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: subColor }}>
                                    {itemIsRest && item.meal
                                      ? item.meal.charAt(0).toUpperCase() + item.meal.slice(1)
                                      : `${formatTime12(item.start_time)} – ${formatTime12(item.end_time)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail bubble */}
          <div
            style={{
              flex: selected ? '0 0 36%' : '0 0 0%',
              minWidth: 0,
              opacity: selected ? 1 : 0,
              transform: selected ? 'translateX(0)' : 'translateX(24px)',
              pointerEvents: selected ? 'auto' : 'none',
              transition: 'flex-basis 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              position: 'sticky',
              top: 24,
            }}
          >
            {selected && (
              <div
                style={{
                  background: detailBg,
                  borderRadius: 20,
                  borderLeft: `4px solid ${detailAccent}`,
                  boxShadow: '0 4px 24px rgba(90,70,40,0.12), 0 1px 6px rgba(90,70,40,0.08)',
                }}
              >
                {/* Close button */}
                <div className="flex justify-end px-5 pt-4">
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background: 'rgba(90,70,40,0.10)',
                      border: 'none',
                      borderRadius: 999,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: detailAccent,
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="px-6 pb-7 pt-2 space-y-5">
                  {/* Type badge */}
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: detailAccent }}
                    >
                      {selected.item.type}
                      {selected.item.meal ? ` · ${selected.item.meal.charAt(0).toUpperCase() + selected.item.meal.slice(1)}` : ''}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <h2 className="text-2xl font-bold leading-tight" style={{ color: detailName }}>
                      {selected.item.name}
                    </h2>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: `1px solid ${detailAccent}22` }} />

                  {/* Date & time */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: detailAccent }}>
                        Date
                      </p>
                      <p className="text-sm font-medium" style={{ color: detailName }}>
                        {selected.dayLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: detailAccent }}>
                        Time
                      </p>
                      <p className="text-sm font-medium" style={{ color: detailName }}>
                        {formatTime12(selected.item.start_time)} – {formatTime12(selected.item.end_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: detailAccent }}>
                        Location
                      </p>
                      <p className="text-sm font-medium leading-snug" style={{ color: detailName }}>
                        {selected.item.location}
                      </p>
                    </div>
                  </div>

                  {/* Transit map — from previous event to this one */}
                  <div style={{ borderTop: `1px solid ${detailAccent}22` }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: detailAccent }}>
                      Getting Here
                    </p>
                    {selected.prevItem || selected.nextItem ? (
                      <TransitMap
                        fromName={(selected.prevItem ?? selected.nextItem)!.location}
                        toName={selected.prevItem ? selected.item.location : selected.nextItem!.location}
                        accentColor={detailAccent}
                        nameColor={detailName}
                      />
                    ) : (
                      <p className="text-xs" style={{ color: detailAccent, opacity: 0.6 }}>
                        No adjacent event to route from.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky Add to Calendar bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 40,
        }}
      >
        <div ref={calMenuRef} style={{ position: 'relative' }}>
          <button
            className="sg-btn px-6 py-3 text-sm flex items-center gap-2"
            onClick={() => setCalMenuOpen(o => !o)}
            disabled={addingToGcal}
          >
            {addingToGcal ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Opening…
              </>
            ) : (
              'Add to Calendar'
            )}
          </button>

          {calMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                right: 0,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                minWidth: 200,
              }}
            >
              <button
                onClick={handleGoogleCalendar}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 18px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Google Calendar
              </button>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <button
                onClick={handleDownloadIcs}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 18px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Download .ics
              </button>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
