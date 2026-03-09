import { NextRequest, NextResponse } from 'next/server';

const LEAGUES = [
  { id: 'NBA', path: 'basketball/nba', aliases: ['nba', 'basketball'] },
  { id: 'NFL', path: 'football/nfl', aliases: ['nfl', 'football'] },
  { id: 'MLB', path: 'baseball/mlb', aliases: ['mlb', 'baseball'] },
  { id: 'NHL', path: 'hockey/nhl', aliases: ['nhl', 'hockey'] },
  { id: 'Premier League', path: 'soccer/eng.1', aliases: ['premier league', 'epl', 'soccer'] },
] as const;

interface EspnCompetitor {
  homeAway?: 'home' | 'away';
  score?: string | number;
  team?: { displayName?: string };
}

interface EspnCompetition {
  id?: string;
  date?: string;
  venue?: { fullName?: string };
  competitors?: EspnCompetitor[];
  status?: { type?: { shortDetail?: string; description?: string } };
}

interface EspnEvent {
  id?: string;
  shortName?: string;
  competitions?: EspnCompetition[];
}

function inferLeague(query: string) {
  const normalized = query.toLowerCase();
  return LEAGUES.find(league => league.aliases.some(alias => normalized.includes(alias))) || LEAGUES[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!rawQuery) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const league = inferLeague(rawQuery);
    const url = `https://site.api.espn.com/apis/site/v2/sports/${league.path}/scoreboard`;
    const response = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!response.ok) {
      return NextResponse.json({ error: 'Could not load sports data.' }, { status: 502 });
    }

    const payload = await response.json();
    const normalizedQuery = rawQuery.toLowerCase();
    const events: EspnEvent[] = Array.isArray(payload?.events) ? payload.events : [];
    const filtered = events.filter(event => {
      const names = (event.competitions?.[0]?.competitors || []).map(team => team.team?.displayName || '').join(' ').toLowerCase();
      return normalizedQuery.split(/\s+/).some((token: string) => token.length > 3 && names.includes(token));
    });
    const chosenEvents = (filtered.length > 0 ? filtered : events).slice(0, 4);

    const mappedEvents = chosenEvents.map(event => {
      const competition = event.competitions?.[0];
      const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
      const home = competitors.find(entry => entry.homeAway === 'home') || competitors[0] || {};
      const away = competitors.find(entry => entry.homeAway === 'away') || competitors[1] || {};

      return {
        id: String(event.id || competition?.id || `${event.shortName || 'event'}-${competition?.date || 'unknown'}`),
        status: competition?.status?.type?.shortDetail || competition?.status?.type?.description || 'Scheduled',
        summary: event.shortName || undefined,
        homeTeam: home.team?.displayName || 'Home',
        awayTeam: away.team?.displayName || 'Away',
        homeScore: String(home.score ?? '0'),
        awayScore: String(away.score ?? '0'),
        venue: competition?.venue?.fullName || undefined,
        startTime: competition?.date ? new Date(competition.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined,
      };
    });

    return NextResponse.json({
      league: league.id,
      queryLabel: rawQuery,
      updatedAt: payload?.day?.date ? new Date(payload.day.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined,
      events: mappedEvents,
      sourceLabel: 'ESPN',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sports lookup failed.' }, { status: 500 });
  }
}
