input:
  opportunity_id: OP-018

tasks:
  - identify_direct_competitors
  - identify_indirect_competitors
  - capture_pricing
  - analyze_negative_reviews
  - identify_switching_costs
  - identify_market_gaps

output:
  competitors: []
  pricing_observations: []
  complaints: []
  gaps: []
  evidence_ids: []

constraints:
  minimum_direct_competitors: 3
  minimum_independent_sources: 5
  every_claim_requires_evidence: true
