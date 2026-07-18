# PitWall Core: Human Threat Intelligence for F1

## The Problem: The Human Element
F1 strategy isn't lost to bad data; it's lost to bad signals. In a sport where 3 seconds decides a race, the most dangerous thing on the track isn't the competitor's car—it's the human calling their strategy. 

Drivers misreport tire conditions under pressure. Rival teams deliberately feed false information over open radio channels to manipulate your pit calls. Opposing strategists have decision patterns that repeat across every race—predictable, exploitable, and completely unmodeled by traditional tools.

Today's strategy tools analyze the *car*. Nobody is analyzing the *people*.

## AI/Technical Approach
**PitWall Core** is a Next.js-based Human Threat Intelligence dashboard that uses IBM AI technologies to profile and exploit opposing strategists and drivers.

- **IBM Granite (Behavioral Exploit Engine)**: Analyzes real-time radio communications and cross-references them with deterministic telemetry. It detects "Signal Mismatches" (e.g., when a driver claims their tires are dead, but telemetry shows optimum grip) to flag deliberate disinformation and radio bluffs.
- **IBM Docling (Knowledge Grounding)**: Ingests years of historical race data, team radio transcripts, and strategist decisions into a RAG pipeline. It builds a "Strategist Fingerprint"—a psychological profile of opposing race engineers (like Gianpiero Lambiase) to predict their next strategic move based on historical tendencies.
- **Next.js & Tailwind CSS**: A hyper-dense, grid-based "Command Terminal" UI that breaks the traditional SaaS dashboard paradigm, delivering information exactly how a trackside engineer needs it.

## Why This Matters in Racing
By shifting the focus from vehicle telemetry to human behavioral modeling, teams can stop falling for radio bluffs and dummy pit crew deployments. PitWall Core turns the opposing team's psychological warfare against them, transforming human unpredictability into a deterministic, exploitable metric.

## Running the Prototype
1. Clone the repository.
2. Run `npm install`
3. Run `npm run dev`
4. Open `http://localhost:3000` to view the live Human Threat Intel terminal.

*(Note: The current prototype uses mocked IBM API endpoints to demonstrate the UI and behavioral exploit logic in a predictable environment for judging).*
