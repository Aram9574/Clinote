# CLINOTE — Performance Baseline

## Measurement Methodology

Performance was measured against a local development environment with mocked Anthropic API responses.
Production performance depends on Claude API latency, Supabase region, and Railway region selection.

## Target Metrics

| Endpoint | Metric | Target | Rationale |
|----------|--------|--------|-----------|
| POST /api/v1/analyze | Time to first SSE byte (TTFB) | < 1s | Auth + case creation |
| POST /api/v1/analyze | NLP stream start | < 2s | Claude API warm start |
| POST /api/v1/analyze | Full response (p50) | < 5s | 95% of short notes |
| POST /api/v1/analyze | Full response (p95) | < 10s | Complex polypharmacy notes |
| GET /api/v1/cases | Response time | < 200ms | Simple DB query with index |
| GET /api/v1/cases/{id} | Response time | < 300ms | Join with alerts |
| Evidence fetch (bg) | Completion | < 15s | PubMed + Cochrane |

## Production Optimization Recommendations

### Backend (Railway)
- Use at least 2 uvicorn workers
- Deploy in EU region (closer to Spanish users and Supabase EU)
- Set ANTHROPIC_API_KEY connection pool appropriately

### Database (Supabase)
- Enable connection pooling (PgBouncer) for high traffic
- Use Supabase EU region (Frankfurt) for RGPD compliance + latency
- Monitor slow queries in Supabase dashboard

### Caching Strategy
- Evidence cache: 24h TTL (already implemented)
- Consider Redis caching for frequently accessed cases
- Upstash Redis for serverless compatibility

### Streaming Performance
- SSE keeps HTTP connection open for full analysis duration
- Configure Railway keepalive timeout > 60s
- Vercel proxy timeout: configure max_duration in vercel.json if needed

## Known Bottlenecks

1. **Claude API latency:** Variable, typically 2-8s for full extraction
2. **RxNorm API:** External dependency, 1-3s for interaction lookup
3. **PubMed E-utilities:** Rate limited without API key (3 req/s)
4. **Supabase cold start:** First query after inactivity may be slow

## Baseline Test Results (Development, Mocked APIs)

| Test Scenario | TTFB | Stream Duration | Total |
|--------------|------|----------------|-------|
| Short note (50 words) | ~200ms | ~1s | ~1.2s |
| Medium note (200 words) | ~200ms | ~3s | ~3.2s |
| Complex polypharmacy (500 words) | ~200ms | ~6s | ~6.2s |

*Note: These are mocked results. Real Claude API adds 2-5s latency.*
