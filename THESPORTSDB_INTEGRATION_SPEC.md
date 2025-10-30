# TheSportsDB API Integration Spec for Sportisode

## Executive Summary

This specification outlines a comprehensive integration of TheSportsDB's free API into Sportisode's frontend and backend architecture. The integration will enhance the platform with real-time sports data, artwork, and metadata while maintaining performance, reliability, and user experience standards.

## Current Architecture Analysis

### Backend (Django)
- **Models**: League, Team, Athlete with JSON fields for standings, roster, schedule
- **Views**: REST API endpoints with caching (15-30 min) and background updates via Celery
- **Tasks**: Background data synchronization using TheSportsDB API endpoints
- **URLs**: `/sports/leagues/<slug>/`, `/sports/teams/<slug>/`, `/sports/athletes/<slug>/`

### Frontend (React/Vite)
- **State Management**: Redux Toolkit with RTK Query for API calls
- **Components**: LeaguesTabContent, TeamsTabContent, AthletesTabContent
- **API Layer**: Centralized fetch functions in `api.js` with authentication
- **Caching**: React Query with configurable stale times

## Integration Objectives

1. **Enhanced Data Freshness**: Real-time standings, schedules, and player info
2. **Rich Media Integration**: Team logos, player images, venue artwork
3. **Improved User Experience**: Dynamic league exploration and team following
4. **Performance Optimization**: Intelligent caching and background sync
5. **Error Resilience**: Graceful degradation and fallback mechanisms

## API Endpoints Integration

### Free Tier Endpoints to Implement

| Feature | TheSportsDB Endpoint | Integration Point |
|---------|---------------------|-------------------|
| League Details | `https://www.thesportsdb.com/api/v1/json/1/search_all_leagues.php?s=Soccer` | Backend data population |
| Team Info | `https://www.thesportsdb.com/api/v1/json/1/search_all_teams.php?l=English%20Premier%20League` | Team roster enrichment |
| Player Info | `https://www.thesportsdb.com/api/v1/json/1/searchplayers.php?t=Arsenal` | Athlete profile enhancement |
| Event Schedule | `https://www.thesportsdb.com/api/v1/json/1/eventsnextleague.php?id=4328` | Upcoming matches |
| Live Scores | `https://www.thesportsdb.com/api/v1/json/1/latestsoccer.php` | Real-time match updates |

### Premium Tier Considerations (Future)
- Video highlights: Enhanced match coverage
- Livescores: Real-time match tracking
- Extended artwork: Higher resolution images

## Data Flow Architecture

### Backend Data Synchronization

```python
# Enhanced LeagueDetailView with TheSportsDB integration
class LeagueDetailView(generics.RetrieveAPIView):
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Check cache first
        cached_data = cache.get(f'league_detail_{instance.slug}')
        if cached_data:
            return Response(cached_data)

        # Fetch fresh data from TheSportsDB
        try:
            # League standings
            standings_url = f'https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l={instance.id}&s=2024-2025'
            response = requests.get(standings_url, timeout=10)
            if response.status_code == 200:
                instance.standings = response.json().get('table', [])
                instance.save(update_fields=['standings'])

            # League teams and metadata
            teams_url = f'https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l={instance.name}'
            # ... process teams data

        except Exception as e:
            # Log error but continue with cached data
            logger.warning(f"TheSportsDB API error for league {instance.name}: {e}")

        # Return enhanced data
        serializer = self.get_serializer(instance)
        data = serializer.data
        cache.set(f'league_detail_{instance.slug}', data, 900)  # 15 min cache
        return Response(data)
```

### Frontend API Integration

```javascript
// Enhanced api.js with TheSportsDB direct calls
export const fetchLeagueDetail = async (slug) => {
    // Try backend first (with TheSportsDB enrichment)
    try {
        const response = await authenticatedFetch(`/sports/leagues/${slug}/`, {
            method: 'GET'
        });
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Backend league fetch failed, trying TheSportsDB directly');
    }

    // Fallback to direct TheSportsDB call
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=${encodeURIComponent(slug)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch league details for: ${slug}`);
    }
    return response.json();
};
```

## Caching Strategy

### Multi-Level Caching Architecture

1. **Browser Cache (React Query)**
   - League lists: `staleTime: Infinity` (rarely changes)
   - League details: `staleTime: 5 * 60 * 1000` (5 minutes)
   - Team details: `staleTime: 10 * 60 * 1000` (10 minutes)
   - Live data: `staleTime: 30 * 1000` (30 seconds)

2. **Backend Cache (Django Cache)**
   - League standings: 15 minutes
   - Team schedules: 15 minutes
   - Athlete info: 30 minutes
   - Event details: 1 hour

3. **Database Cache (JSON Fields)**
   - Persistent storage of API responses
   - Fallback when external API unavailable

### Cache Invalidation Strategy

```javascript
// Cache invalidation on data updates
const updateLeagueData = async (leagueId) => {
    // Invalidate React Query cache
    queryClient.invalidateQueries(['leagueDetail', leagueSlug]);

    // Invalidate backend cache via API call
    await authenticatedFetch(`/sports/leagues/${leagueId}/invalidate/`, {
        method: 'POST'
    });
};
```

## Error Handling & Fallback Mechanisms

### Graceful Degradation Strategy

1. **API Failure Handling**
   - Network timeouts: 10-second timeout with retry
   - Rate limiting: Exponential backoff (1s, 2s, 4s, 8s)
   - Service unavailable: Fallback to cached data

2. **Data Validation**
   - Schema validation for API responses
   - Default values for missing fields
   - Data sanitization before storage

3. **User Experience**
   - Loading states with skeleton components
   - Error boundaries for component isolation
   - Offline mode with cached data

### Error Recovery Patterns

```javascript
// Circuit breaker pattern for API calls
class APIClient {
    constructor() {
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.timeout = 60000; // 1 minute circuit break
    }

    async call(endpoint) {
        if (this.isCircuitOpen()) {
            throw new Error('Circuit breaker open - using cached data');
        }

        try {
            const response = await fetch(endpoint);
            this.reset();
            return response;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    isCircuitOpen() {
        return this.failureCount >= 3 &&
               Date.now() - this.lastFailureTime < this.timeout;
    }
}
```

## Performance Optimization

### Data Fetching Patterns

1. **Lazy Loading**
   - League details loaded on demand
   - Team rosters paginated
   - Images loaded with intersection observer

2. **Background Synchronization**
   - Celery tasks for data updates
   - WebSocket notifications for live updates
   - Cron jobs for bulk data refresh

3. **Bundle Optimization**
   - Code splitting for sports components
   - Image optimization and WebP support
   - CDN integration for static assets

### Rate Limiting & Quota Management

```python
# Rate limiting configuration
THESPORTSDB_RATE_LIMITS = {
    'requests_per_minute': 30,
    'requests_per_hour': 100,
    'burst_limit': 10
}

class TheSportsDBClient:
    def __init__(self):
        self.requests_this_minute = 0
        self.requests_this_hour = 0
        self.last_reset_minute = datetime.now()
        self.last_reset_hour = datetime.now()

    def can_make_request(self):
        now = datetime.now()
        if (now - self.last_reset_minute).seconds >= 60:
            self.requests_this_minute = 0
            self.last_reset_minute = now

        if (now - self.last_reset_hour).seconds >= 3600:
            self.requests_this_hour = 0
            self.last_reset_hour = now

        return (self.requests_this_minute < THESPORTSDB_RATE_LIMITS['burst_limit'] and
                self.requests_this_hour < THESPORTSDB_RATE_LIMITS['requests_per_hour'])
```

## UI Integration Points

### Enhanced Components

1. **League Explorer**
   - Dynamic league cards with real-time standings
   - Team logos and branding colors
   - Interactive league selection

2. **Team Profiles**
   - Live roster updates
   - Upcoming match schedules
   - Player statistics and images

3. **Match Highlights**
   - Live score widgets
   - Match result notifications
   - Video highlight integration (premium)

### New Features

1. **Live Match Tracker**
   - Real-time score updates
   - Match event notifications
   - Push notifications for followed teams

2. **Player Search & Discovery**
   - Advanced player search
   - Career statistics
   - Transfer news and updates

3. **League Standings Widget**
   - Interactive league tables
   - Team performance trends
   - Playoff qualification tracking

## Implementation Roadmap

### Phase 1: Core Integration (Week 1-2)
- [ ] Enhance backend API clients
- [ ] Implement caching layers
- [ ] Add error handling middleware
- [ ] Update existing components

### Phase 2: Feature Enhancement (Week 3-4)
- [ ] Add live score widgets
- [ ] Implement player search
- [ ] Create league standings components
- [ ] Add image optimization

### Phase 3: Advanced Features (Week 5-6)
- [ ] WebSocket live updates
- [ ] Push notifications
- [ ] Video highlights (premium)
- [ ] Advanced analytics

### Phase 4: Optimization & Monitoring (Week 7-8)
- [ ] Performance monitoring
- [ ] Error tracking and alerting
- [ ] Rate limiting optimization
- [ ] User feedback integration

## Migration Strategy

### Data Migration
1. **Existing Data Preservation**
   - Backup current JSON field data
   - Validate data integrity
   - Create rollback procedures

2. **Incremental Updates**
   - Update one league at a time
   - Monitor API usage and performance
   - Gradual rollout with feature flags

3. **Schema Evolution**
   - Add new fields for TheSportsDB data
   - Maintain backward compatibility
   - Update serializers incrementally

### Testing Strategy
- Unit tests for API clients
- Integration tests for data flows
- E2E tests for user journeys
- Performance tests for caching
- Error scenario testing

## Success Metrics

1. **Performance**
   - API response time < 500ms (cached)
   - Page load time < 2 seconds
   - Cache hit rate > 90%

2. **Reliability**
   - API uptime > 99.5%
   - Error rate < 1%
   - Fallback success rate > 95%

3. **User Experience**
   - Data freshness < 15 minutes
   - Image load time < 1 second
   - Mobile performance parity

## Risk Mitigation

1. **API Dependency Risks**
   - Multiple fallback strategies
   - Local data caching
   - Alternative data sources

2. **Rate Limiting Risks**
   - Request queuing and throttling
   - Premium tier planning
   - Usage monitoring

3. **Data Quality Risks**
   - Response validation
   - Data cleansing pipelines
   - Manual override capabilities

## Conclusion

This integration will transform Sportisode into a comprehensive sports platform with real-time data, rich media, and enhanced user engagement. The phased approach ensures minimal disruption while delivering maximum value through progressive enhancement.

The specification provides a solid foundation for implementation, with clear architectural decisions, performance optimizations, and risk mitigation strategies.