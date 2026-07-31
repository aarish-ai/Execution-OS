SAMPLE_TRANSCRIPT = """Ahmed: Alright, let's kick off. We need to decide on the database for the new recommendation engine. Sarah, what did you find?

Sarah: I looked at three options. Postgres with pgvector is the most practical. It handles both relational and vector search. We've already got it running. Redis would be overkill for our data size.

Ahmed: I agree. Let's go with Postgres plus pgvector. Decision made. Omar, can you set up the schema this week?

Omar: Sure. I'll have it done by Thursday.

Ahmed: Good. Open question: do we need a separate vector index or is HNSW in pgvector enough? Sarah, can you spike that by next Wednesday?

Sarah: Yes, I'll run benchmarks.

Ahmed: Now, about the API layer. Last month we agreed to use GraphQL. But I'm thinking REST might be simpler for now.

Omar: Wait — we specifically decided GraphQL in the March 12th meeting because Sarah said REST would cause versioning issues down the road.

Ahmed: Fair point. Let's table that for now. Open question: revisit API layer decision before we start the frontend.

Sarah: Also, the mobile app — do we still want to build it in V1?

Ahmed: No. We dropped that two weeks ago. Mobile is V2.

Sarah: Right, sorry. Final thing — weekly brief emails. Should we add those to the scope?

Ahmed: Not in V1. Let's stay focused. Alright, to recap: Postgres with pgvector confirmed, Omar owns the schema by Thursday, Sarah spikes HNSW benchmarks by next Wednesday, API layer decision is still open. That's it."""
