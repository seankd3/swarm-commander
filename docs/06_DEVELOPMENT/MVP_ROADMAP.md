# MVP Roadmap — Minimum Viable Game to Full Release

> **Philosophy:** Ship something playable as fast as possible. Get playtester feedback. Iterate.
> Every phase produces a playable build. No phase depends on unbuilt future systems.

---

## What is the Minimum Viable NEXUS?

The MVP is **Mission 1 from the campaign** — playable, polished, and demonstrating the core sensor gameplay loop. A player should be able to:

1. See a 3D globe
2. Command a small swarm of recon drones
3. Use sensors to detect a target
4. Watch detection confidence build from Anomaly → Identified
5. Experience the satisfaction of "solving" a sensor puzzle
6. Do all of this with pause/play/speed controls

**If this isn't fun, nothing else matters.** Nail this loop before building anything else.

---

## Phase 0: Technical Foundation (Weeks 1-3)

> **Deliverable:** Engine running, globe rendering, basic entity movement

### Week 1: Project Setup
- [ ] Godot 4 project initialized with folder structure matching design docs
- [ ] CesiumJS or MapboxGL integration for globe rendering (or custom globe with texture)
- [ ] Basic camera controls: rotate, zoom, pan on globe
- [ ] WGS84 coordinate system for entity positioning
- [ ] Build pipeline: one-command build for Windows + Web

### Week 2: Entity Foundation
- [ ] ECS architecture (Godot's built-in node system or custom lightweight ECS)
- [ ] Basic entity: position, velocity, heading on globe surface
- [ ] Simple pathfinding: point-to-click movement on globe
- [ ] Entity rendering: simple icon/sprite on globe at all zoom levels
- [ ] 5 zoom levels with smooth transitions

### Week 3: Time System
- [ ] Game clock with variable speed: Pause, 1×, 3×, 10×, 30×, 100×
- [ ] Active Pause: full UI interaction while paused
- [ ] Time display in UI (mission clock)
- [ ] Speed controls (keyboard shortcuts: space=pause, 1-5=speeds)
- [ ] All systems tick on game-time, not real-time

### Quality Gate: Globe spins, entities move, time controls work.

---

## Phase 1: Core Sensor Loop (Weeks 4-7)

> **Deliverable:** "Find the submarine" — Mission 1 playable

### Week 4: Basic Sensors
- [ ] SensorComponent: type, range, FOV, active/passive flag
- [ ] Detection range check (simple circle for now)
- [ ] Fog of war: areas outside sensor range are dark/hidden
- [ ] Sensor visualization: range circles on globe when selected
- [ ] Single sensor type: EO/IR (passive, medium range)

### Week 5: Detection Confidence
- [ ] 5-state confidence model (Undetected → Anomaly → Contact → Track → Identified)
- [ ] Confidence accumulation formula (sensor_power / distance² × signature × environment)
- [ ] Confidence decay when out of sensor range
- [ ] Position uncertainty ellipse rendering
- [ ] Contact display: icon changes based on confidence state

### Week 6: Swarm Basics
- [ ] Swarm as entity group (4-12 units)
- [ ] Swarm movement: click destination, swarm moves together
- [ ] Formation: basic spread based on dispersion parameter
- [ ] Swarm selection and management (click to select, info panel)
- [ ] Simple swarm AI: move to waypoint, scan area on arrival

### Week 7: Mission 1 Assembly
- [ ] Scenario loading: place entities from data file
- [ ] Objective system: "Find and identify target X"
- [ ] Mission briefing screen (text + globe highlight)
- [ ] Win condition: target reaches Identified state
- [ ] Mission complete screen with basic stats
- [ ] **THE TARGET:** A submarine with low EO/IR signature that requires patient searching

### Quality Gate: A player can load Mission 1, command recon drones, and find a submarine. It's fun.

---

## Phase 2: Emission Economy (Weeks 8-12)

> **Deliverable:** The core "see vs be seen" tradeoff. Missions 2-3 playable.

### Week 8: Active vs Passive Sensors
- [ ] Radar sensor type (active: long range, emits)
- [ ] ELINT sensor type (passive: detects active emitters)
- [ ] The 2× rule: ELINT detection range = 2× radar range
- [ ] Emission signature component on all entities
- [ ] When radar is ON, entity's EM signature increases

### Week 9: EMCON System
- [ ] EMCON profiles per swarm (Strict/Limited/Normal/Aggressive)
- [ ] UI controls for EMCON setting
- [ ] RWR on all units (passive alert when illuminated by enemy radar)
- [ ] RWR visualization: bearing lines to detected emitters
- [ ] Enemy AI that reacts to detecting your emissions

### Week 10: Multiple Sensor Types
- [ ] Acoustic sensor type (passive, short range, ground/maritime)
- [ ] IRST sensor type (passive, medium range, air)
- [ ] Sensor fusion: multiple sensors on same contact
- [ ] Fusion bonus formula (unique types × 0.3 multiplier)
- [ ] Track correlation (merging contacts from different sensors)

### Week 11: Sensor UI
- [ ] Sensor overlay on globe (coverage areas, color-coded by type)
- [ ] Contact info panel (confidence breakdown by contributing sensor)
- [ ] EMCON indicator on swarm icons
- [ ] RWR threat display
- [ ] Tooltip system: hover over any sensor element for explanation

### Week 12: Missions 2-3
- [ ] Mission 2: "Listening Post" — use ELINT to detect convoy radar emissions
- [ ] Mission 3: "The Sweep" — first active radar use, enemy reacts to your emissions
- [ ] Enemy AI: basic patrol, activate sensors, respond to detection
- [ ] Mission failure states with explanation ("Your radar revealed your position")

### Quality Gate: The emission economy works. Turning on radar feels risky. ELINT feels powerful. Players understand "emit = be seen."

---

## Phase 3: Combat & Kill Chain (Weeks 13-17)

> **Deliverable:** Full kill chain. Missions 4-5 playable.

### Week 13: Sensor Layering Depth
- [ ] SAR radar mode (ground mapping, finds stationary targets)
- [ ] Terrain effects on sensors (forest blocks EO/IR, mountains block radar LOS)
- [ ] Weather system (basic: clear/rain/fog/storm affecting sensor ranges)
- [ ] Classification speed varies by sensor type

### Week 14: Combat Resolution
- [ ] Hit probability formula
- [ ] Damage model (HP, armor, penetration)
- [ ] Critical hit system (subsystem damage)
- [ ] HORNET platform (loitering munition — one-shot strike drone)
- [ ] Weapon firing and impact visualization

### Week 15: Kill Chain
- [ ] Strike planning overlay: select target → assign weapon → confirm engagement
- [ ] Battle Damage Assessment (BDA): post-strike sensor pass to confirm kill
- [ ] Engagement timeline visualization
- [ ] Sensor-to-shooter flow: can only engage contacts at Track or higher confidence

### Week 16: Enemy Forces
- [ ] Enemy air defense (SAM sites with radar)
- [ ] Enemy detection of player forces
- [ ] Enemy engagement: SAMs fire at detected player platforms
- [ ] SAM avoidance: terrain masking, EMCON to avoid detection
- [ ] SEAD concept: find the SAM radar, kill the SAM

### Week 17: Missions 4-5
- [ ] Mission 4: "Eyes and Ears" — multi-sensor layering against a defended base
- [ ] Mission 5: "First Strike" — complete F2T2EA kill chain
- [ ] Post-mission stats screen (detection timeline, kill chain efficiency)

### Quality Gate: Complete sensor→detect→identify→strike→assess loop. Players feel the kill chain.

---

## Phase 4: Operational Scale (Weeks 18-23)

> **Deliverable:** Multi-swarm management. Missions 6-10. Economy basics.

### Week 18: Multi-Swarm Command
- [ ] Swarm manager panel (list of all swarms)
- [ ] Autonomy parameter (how much swarm AI decides independently)
- [ ] Approval queue (pending decisions from swarms)
- [ ] Attention management: multiple swarms competing for player focus
- [ ] Swarm behavioral parameters (aggression, dispersion, persistence, stealth, collateral)

### Week 19: Swarm AI
- [ ] 4-layer AI hierarchy (reactive, tactical, operational, adaptive)
- [ ] Reactive layer: collision avoidance, threat evasion
- [ ] Tactical layer: formation control, fire coordination
- [ ] Operational layer: route planning, objective pursuit
- [ ] AI quality scales with Autonomy parameter

### Week 20: Electronic Warfare
- [ ] WHISPER EW platform
- [ ] Noise jamming (degrades enemy radar range)
- [ ] Jamming as ELINT beacon (double-edged sword)
- [ ] Anti-radiation missiles (home on enemy radar emissions)
- [ ] EW overlay on globe (jamming coverage areas)

### Week 21: Economy & Logistics
- [ ] Compute Cycles resource (limits simultaneous swarms)
- [ ] Manufacturing resource (produces new platforms)
- [ ] Logistics Points (sustains deployed swarms)
- [ ] Forward Operating Bases as spawn/resupply points
- [ ] ATLAS/MULE logistics platforms

### Week 22: Weather & Terrain Depth
- [ ] Procedural weather generation per theater
- [ ] Weather transitions over time (storm approaches, clears)
- [ ] Full terrain effect matrix (urban, forest, mountain, desert, ocean, arctic)
- [ ] Weather forecast overlay (predict conditions 6-12 hours ahead)
- [ ] Night/day cycle with effects on EO sensors

### Week 23: Missions 6-10
- [ ] Missions introducing multi-swarm, weather, EW, economy one at a time
- [ ] Mission 9: first long-duration mission requiring logistics management
- [ ] Difficulty scaling based on player performance

### Quality Gate: Operational-scale gameplay works. Managing 4+ swarms feels engaging, not overwhelming.

---

## Phase 5: Theater Scale & Polish (Weeks 24-30)

> **Deliverable:** Full campaign (20 missions). Theater-level gameplay. Release candidate.

### Weeks 24-25: Theater Systems
- [ ] Full 5-resource economy
- [ ] Tech tree (5 branches, 10 tiers each)
- [ ] Political Capital system
- [ ] Intel Credits and intelligence purchasing
- [ ] Theater-level strategic decisions

### Weeks 26-27: Full Platform Roster
- [ ] All 17 platform types implemented and balanced
- [ ] Platform unlocking through campaign progression
- [ ] Swarm composition builder (player assembles custom swarms)
- [ ] Maritime platforms (ORCA, BARRACUDA, LEVIATHAN)
- [ ] Space platforms (SENTINEL-SAT, HAMMER orbital strike)

### Week 28: Campaign Completion
- [ ] Missions 11-20+ across all theaters
- [ ] Campaign narrative (briefings, story beats between missions)
- [ ] Difficulty modes (Cadet / Commander / Veteran)
- [ ] Campaign branching based on player choices

### Week 29: Sandbox Mode
- [ ] Free-play with unlimited resources
- [ ] Scenario editor (place forces, set objectives, save/share)
- [ ] AI opponent with configurable difficulty
- [ ] Replay system (watch completed missions)

### Week 30: Polish & Launch Prep
- [ ] Full audio pass (FMOD integration, dynamic mixing)
- [ ] UI animation polish (panel transitions, data flow effects)
- [ ] Performance optimization (10,000+ unit stress test)
- [ ] Tutorial refinement based on playtesting feedback
- [ ] Save/load system
- [ ] Settings menu (graphics, audio, controls, accessibility)

### Quality Gate: Complete game. 20+ hour campaign. Sandbox with replay value. Ready for Early Access.

---

## Milestones Summary

| Week | Milestone | Playable State |
|------|-----------|---------------|
| 3 | Tech foundation | Globe + entities + time controls |
| 7 | **MVP: Mission 1** | Find-the-submarine sensor puzzle |
| 12 | Emission economy | Missions 1-3, "see vs be seen" loop |
| 17 | Kill chain | Missions 1-5, complete F2T2EA |
| 23 | Operational scale | Missions 1-10, multi-swarm + economy |
| 30 | **Release candidate** | Full campaign + sandbox |

---

## Playtesting Schedule

- **Week 7:** First external playtest (Mission 1 only). Is the sensor puzzle fun?
- **Week 12:** Second playtest (Missions 1-3). Does the emission economy create tension?
- **Week 17:** Third playtest (Missions 1-5). Is the kill chain satisfying?
- **Week 23:** Fourth playtest (Missions 1-10). Does operational scale feel manageable?
- **Week 28+:** Ongoing beta testing with expanding audience

**Critical question at each playtest:** "Did you understand what to do without being told?" If no → tutorial/UI needs work.
