# Project Audit & Scalable MVP Architecture

> **Purpose:** Honest assessment of the current design, identification of risks,
> and a re-architected MVP that scales from day-one prototype to full release
> without rewrites.

---

## Part 1: Design Audit

### What's Excellent

**1. The core insight is correct: "Information IS the weapon."**
The sensor fusion loop (detect → classify → identify → act → assess) is genuinely
compelling game design. It maps to real doctrine (F2T2EA), creates natural tension
(emit to see = be seen), and produces the kind of "aha!" moments that make
strategy games sticky. This is a solid foundation.

**2. The MVP scoping (v2.0) is good.**
The revised MVP_DESIGN.md — one MPA, one submarine, no combat, AOU instead of
abstract percentages — is a massive improvement over the original vision. This is
the right first playable. It tests the core question: "Is the sensor puzzle fun?"

**3. Research depth is exceptional.**
The game research docs (HOI4, CMO, Highfleet, VTOL VR, PA:T, Rimworld) extract
the right lessons. The military doctrine docs ground the simulation in reality
without getting lost in mil-sim pedantry. The synthesis document distills this
into actionable principles.

**4. Learning curve design is the right approach.**
Progressive disclosure (one system per mission, UI elements unlock with
understanding) directly addresses the HOI4 problem. This is well-designed
pedagogy.

**5. The AOU model is better than confidence percentages.**
The v2.0 shift to Area of Uncertainty (datum + expanding circle + bearing
intersection) is more physically grounded, more visually intuitive, and more
fun to interact with than abstract confidence floats.

---

### Contradictions and Risks

**1. Two competing MVP visions exist — and they conflict.**

`MVP_DESIGN.md` says:
- 2D tactical display, single MPA, 4 sensor types, no globe, 6-10 weeks

`MVP_ROADMAP.md` says:
- 3D globe with CesiumJS, swarm of recon drones, 5-state confidence model,
  Godot 4, 30 weeks

These are fundamentally different products. The MVP_DESIGN is a focused
prototype testing one question. The MVP_ROADMAP is a full game development
schedule that includes a globe renderer, ECS architecture, and 5 phases of
escalating features.

**Risk:** Without resolving this, development starts with an ambiguous target.
Build the 2D tactical prototype first, or go straight to globe + engine?

**Recommendation:** They are sequential, not competing. Build MVP_DESIGN first
(2D, single mission, pure sensor puzzle). Use it to validate the fun. Then
migrate the proven mechanics into the full engine (MVP_ROADMAP Phase 0+).
This is documented in Part 2 below.

**2. The SENSOR_FUSION_SYSTEM.md still uses confidence percentages.**

The AOU model in MVP_DESIGN.md (v2.0) is the better design — but
SENSOR_FUSION_SYSTEM.md still defines the 5-state confidence float (0.0-1.0),
confidence accumulation formulas, and confidence decay rates. These two systems
describe different games.

**Risk:** An implementer reading SENSOR_FUSION_SYSTEM.md builds a percentage-bar
game. An implementer reading MVP_DESIGN.md builds a spatial-uncertainty game.

**Recommendation:** Reconcile these. The AOU model should be the ground truth.
Confidence states can map to AOU thresholds (Tentative = AOU > 5nm, Firm = AOU
< 1nm, etc.) rather than to abstract float ranges. The formulas in
SENSOR_FUSION_SYSTEM.md need rewriting to drive AOU radius rather than a
confidence float. See Part 2 for the unified model.

**3. The Swarm Command system is over-designed for the MVP.**

SWARM_COMMAND_SYSTEM.md specifies 5 behavioral sliders, 4-layer AI hierarchy,
approval queues, 7 objective types, swarm composition rules, and template
builders. This is a Phase 4 feature set being designed at Phase 0.

The MVP has ONE aircraft. It doesn't need swarm AI. It needs: "click map to
assign a task, MPA executes the task."

**Risk:** Pre-designing complex systems before the core loop is proven wastes
design effort and creates psychological commitment to features that may not
survive playtesting.

**Recommendation:** The swarm system is well-designed but should be treated as
a future reference, not an MVP requirement. The MVP tasking system is: 4 mission
types (Search, Patrol, Investigate, Deploy Buoy). That's it.

**4. The tech stack is undefined.**

The project mentions Godot 4, CesiumJS, MapboxGL, custom globe rendering,
Node.js, Python, WebGL, and Three.js in various places. No decision has been
made. The .gitignore suggests Node.js + Python but there's no package.json,
no project structure, no build configuration.

**Risk:** Tech stack indecision delays start. Choosing wrong creates expensive
rewrites.

**Recommendation:** See Part 2 for a specific tech stack recommendation with
reasoning.

**5. The 30-week roadmap is fiction.**

The roadmap allocates exact week counts to every feature, assumes linear
progression, and ends with "Release candidate" at week 30. There's no buffer
for:
- Playtesting feedback requiring redesign
- Technical unknowns (globe rendering performance, sensor simulation at scale)
- Feature cuts
- The iterative nature of game development

**Risk:** The roadmap creates false confidence and doesn't account for the
reality that the first playtest will invalidate assumptions.

**Recommendation:** Replace the 30-week schedule with milestone-based
development. Each milestone produces a playable build. Each playtest gates
the next phase. No time commitments — only quality gates. See Part 2.

**6. No data architecture is defined.**

The design docs define formulas (sensor power, hit probability, confidence
accumulation) but not how game state is structured, serialized, loaded, or
updated. There's no entity schema, no event system, no state management
pattern.

**Risk:** Without a data architecture, the first implementation will be ad-hoc.
Refactoring to add multiplayer, save/load, or replay later requires rewriting
the state layer.

**Recommendation:** Define the data architecture before writing game logic. An
ECS-style architecture with serializable components enables save/load, replay,
and networking from day one. See Part 2.

**7. Combat system is over-specified for its importance.**

COMBAT_RESOLUTION.md defines hit probability formulas, damage types, armor
penetration, critical hit tables, system damage tables, countermeasures, and
BDA requirements. This is 280 lines of specification for what the design docs
call "20% of gameplay."

The combat system doesn't appear until Mission 5. It's not part of the MVP.

**Risk:** Over-specifying combat risks making it the focus of development
attention, inverting the "80% sensor / 20% combat" ratio.

**Recommendation:** Combat resolution for the first few missions can be much
simpler: if Track quality is sufficient and weapon matches target, roll hit
probability. Hit → destroyed. Miss → missed. That's ~20 lines of logic. Save
the granular system for when playtesting shows it's needed.

---

### Missing Elements

**1. No audio design.**
Sound is deferred in the MVP, but the research docs (VTOL VR analysis)
correctly identify audio as critical for sensor feedback. RWR tones, sonar
pings, and detection alerts are part of the core experience. The MVP should
include placeholder audio for at least: sonobuoy deployment, passive detection
ping, active sonar ping, track promotion alerts.

**2. No accessibility considerations.**
Color-coded UI (red/yellow/green indicators, bearing lines, AOU circles)
without alternatives excludes colorblind players. The Palantir-dark aesthetic
may have contrast issues. No mention of key remapping, font scaling, or
screen reader support.

**3. No save/load design.**
Even the MVP needs "save mid-mission and resume later." This isn't mentioned
anywhere.

**4. No performance budgets.**
The AI behavior doc mentions "reactive layer runs every frame" but there are no
overall performance targets: target frame rate, maximum entity count, maximum
active sensors, render budget.

**5. No error/edge-case handling for game logic.**
What happens when:
- All sonobuoys are expended?
- MPA runs out of fuel?
- Submarine exits the play area while being tracked?
- Two bearing lines are parallel (no intersection)?
These edge cases need handling in the MVP.

---

## Part 2: Scalable MVP Architecture

### Philosophy

Build the smallest thing that proves the fun. But build it on a foundation that
scales to the full vision without rewrites. Every line of code written for the
MVP should survive into the final game.

The key insight: **the game is fundamentally a simulation with a UI on top.**
If the simulation layer is well-structured, any renderer (2D canvas, WebGL globe,
Godot 3D) can be swapped without touching game logic.

### Tech Stack Recommendation

```
SIMULATION LAYER (pure logic, no rendering)
├── Language: TypeScript
├── Runtime: Node.js (for testing/CI) + Browser (for play)
├── Architecture: ECS with serializable components
├── Update loop: Fixed-timestep simulation tick
└── Output: State snapshots (renderable by any frontend)

RENDERING LAYER (visual output)
├── Phase 1 (MVP): HTML5 Canvas 2D (fast to build, runs everywhere)
├── Phase 2 (Post-validation): WebGL with deck.gl or Three.js
├── Phase 3 (Globe): CesiumJS or Mapbox GL on top of WebGL
└── Audio: Web Audio API (simple, no dependencies)

BUILD & TOOLING
├── Bundler: Vite (fast, TypeScript-native)
├── Testing: Vitest (simulation layer is pure functions — easy to test)
├── CI: GitHub Actions
└── Deployment: Static site (Vercel/Netlify/GitHub Pages)
```

**Why TypeScript over Godot/C#/Rust:**
- The MVP is a 2D tactical display. Canvas 2D is the fastest path.
- TypeScript runs in the browser — zero install, share a URL to playtest.
- The simulation layer is pure math — language doesn't matter for performance
  at MVP scale (1 aircraft, 1 submarine, 20 sonobuoys).
- If Godot is needed later (3D globe, better rendering), the simulation layer
  ports cleanly — it's just math with no rendering dependencies.
- The team is "one human directing AI coding agents." TypeScript is the
  language AI agents are most productive in.

**Why NOT Godot for MVP:**
- Godot's strengths (scene tree, physics, 3D rendering) are irrelevant for a
  2D tactical map with icons and lines.
- Godot adds build complexity (export templates, platform-specific builds).
- Browser-first means instant playtesting — send a URL, not a .exe.
- If the sensor puzzle isn't fun in 2D, a 3D globe won't save it.

### Data Architecture: The Simulation Core

The simulation is a pure function: `(state, inputs, deltaTime) → newState`

No rendering. No side effects. Fully deterministic. This enables:
- Unit tests on game logic
- Replay by recording inputs
- Save/load by serializing state
- Multiplayer by synchronizing inputs (future)

```
GameState {
    time: GameTime              // Current mission clock
    entities: Map<EntityId, Entity>
    tracks: Map<TrackId, Track>
    sonobuoys: Map<BuoyId, Sonobuoy>
    mission: MissionState
    player: PlayerState
}

Entity {
    id: EntityId
    position: Position          // lat/lon or x/y (2D MVP)
    velocity: Velocity          // heading + speed
    type: EntityType            // MPA, SUBMARINE
    sensors: Sensor[]
    signature: SignatureProfile
    fuel: number
    state: EntityState          // PATROL, SEARCH, TRANSIT, SNORKEL, SILENT
}

Track {
    id: TrackId
    datum: Position             // Last known position
    datumTime: GameTime         // When datum was established
    aouRadius: number           // Current Area of Uncertainty radius
    quality: TrackQuality       // TENTATIVE | FIRM | LOST
    identity: IdentityState     // UNKNOWN | CLASSIFIED | IDENTIFIED
    bearings: Bearing[]         // Contributing bearing lines
    contributingSensors: SensorContact[]
}

Sonobuoy {
    id: BuoyId
    position: Position
    type: BuoyType              // PASSIVE | ACTIVE
    deployed: GameTime
    status: BuoyStatus          // ACTIVE | EXPENDED
    detections: Detection[]
}

MissionState {
    objectives: Objective[]
    timeLimit: number
    timeElapsed: number
    result: MissionResult | null
}

PlayerState {
    currentTask: TaskAssignment | null
    sonobuoysRemaining: number
    fuelRemaining: number
}
```

### The AOU-First Detection Model (Reconciled)

Replace the confidence-float model with AOU as the ground truth. All sensor
interactions produce spatial data, not abstract percentages.

```
Detection Pipeline:

1. SENSOR RANGE CHECK
   Can this sensor detect this target at this range?
   → detection_range = sensor_power / (target_signature × environment)
   → if distance < detection_range: detection event

2. DETECTION EVENT → DATUM
   Sensor contact creates a datum:
   → datum_position = target_actual_position + sensor_error
   → datum_time = current_game_time
   → sensor_error depends on sensor type:
       Passive sonobuoy: bearing only (no range → infinite AOU along bearing)
       Active sonobuoy:  ±200m position fix
       Surface radar:    ±500m position fix
       MAD:              ±100m position fix

3. AOU EXPANSION (every tick)
   AOU grows based on target's possible movement:
   → aou_radius = base_error + (time_since_datum × target_max_speed)
   → Example: sub max speed 8 kts, 10 min since datum
     → aou_radius = 200m + (600s × 4.1 m/s) = 2660m ≈ 1.4nm

4. AOU SHRINKING (new detection)
   New sensor contact creates new datum, resets AOU:
   → aou_radius = new sensor's base_error
   → If multiple bearings intersect: AOU = intersection area

5. BEARING INTERSECTION (passive sensors)
   Two bearing lines from different positions → intersection point
   → intersection_error = f(bearing_accuracy, angle_between_bearings)
   → Best case (90° intersection): error ≈ 500m
   → Worst case (shallow angle): error ≈ 5000m
   → Parallel bearings: NO FIX (display warning to player)

6. TRACK QUALITY (derived from AOU)
   → TENTATIVE: AOU > 5nm (initial detection, single bearing)
   → FIRM:      AOU < 1nm (good position fix, recent datum)
   → LOST:      AOU > 20nm (too old, target could be anywhere)

7. IDENTITY (separate axis)
   → UNKNOWN:    Detected but unclassified
   → CLASSIFIED: Domain known (determined by sensor type + signature)
                 Sonar → subsurface. Radar → surface/air.
   → IDENTIFIED: Type known (requires close sensor pass or
                 multiple sensor types confirming same classification)
   → Classification requires: sustained sensor contact OR specific sensor
     (MAD → confirms submarine, EO/IR → visual ID if close enough)
```

This model is physically grounded, visually clear (circles on a map), and
directly produces the gameplay the MVP_DESIGN describes. It replaces the
confidence float while preserving all the interesting sensor dynamics.

### MVP Milestone Plan (No Dates)

Replace the 30-week timeline with quality-gated milestones. Each milestone
produces a playable build. No milestone starts until the previous one is
validated.

```
MILESTONE 0: "Something on Screen"
──────────────────────────────────
Build:
  - Vite + TypeScript project scaffold
  - Canvas 2D renderer: ocean background, pan/zoom
  - Entity rendering: MPA icon with heading indicator
  - Click-to-move: MPA flies to clicked position
  - Game clock with pause/play/speed (1×, 5×, 20×)

Quality gate: You can see an aircraft icon fly around a blue ocean.
              Time controls work. Pan and zoom work.

Validates: Rendering pipeline, input handling, game loop architecture.
Estimated scope: ~20 source files, ~2000 lines.


MILESTONE 1: "Sonar Contact"
────────────────────────────
Build:
  - Submarine entity: follows patrol route, changes speed states
  - Passive sonobuoy: deploy on click, renders as circle
  - Detection check: sonobuoy vs submarine range + signature
  - Bearing line: when passive buoy detects, draw bearing line
  - Bearing intersection: two bearings → datum position
  - AOU circle: renders around datum, expands over time
  - Track panel: shows active tracks with AOU status

Quality gate: You can drop sonobuoys, see bearing lines appear,
              watch them intersect, and see an AOU circle form.
              The circle grows when you lose contact.

Validates: The core sensor puzzle. Is triangulation satisfying?
Estimated scope: +15 files, +2500 lines.


MILESTONE 2: "The Hunt"
───────────────────────
Build:
  - Active sonobuoy: ping on command, gives position fix
  - Surface radar: MPA radar, detects snorkel/periscope
  - MAD sensor: fly-over detection, very precise
  - Submarine signature states: silent/transit/snorkel
  - Submarine patrol route with snorkel schedule
  - Sonobuoy inventory (20 total, mixed types)
  - Fuel system (MPA endurance)

Quality gate: Full sensor toolkit works. Each sensor type feels
              different and useful. Submarine behavior creates
              windows of opportunity (snorkel = easier to detect).

Validates: Sensor diversity. Resource management (limited buoys).
Estimated scope: +10 files, +2000 lines.


MILESTONE 3: "Mission Complete"
──────────────────────────────
Build:
  - Tasking system: Search Area, Patrol Route, Investigate, Deploy Buoy
  - MPA autopilot: executes assigned tasks (search pattern, patrol path)
  - Track quality states: Tentative → Firm → Lost
  - Identity states: Unknown → Classified → Identified
  - Win condition: Firm Track + Identified
  - Lose condition: time expires / sub exits / track lost
  - Mission briefing screen
  - Results screen with stats (time to first contact, buoys used, etc.)
  - Basic audio: deployment sound, detection ping, track promotion alert

Quality gate: Complete, playable Mission 1. A playtester can start
              the mission, hunt the submarine, and win or lose.
              They understand why they succeeded or failed.

Validates: THE CORE QUESTION — is the sensor puzzle fun?
Estimated scope: +10 files, +2000 lines.
Total project: ~55 files, ~8500 lines.


MILESTONE 4: "The Emission Economy" (Post-validation)
────────────────────────────────────────────────────
Only start this after Milestone 3 playtesting confirms the fun.

Build:
  - Submarine reacts to active sensors (goes silent, evades)
  - RWR system (submarine detects your radar/active sonar)
  - The 2× rule: submarine's passive sensors detect your emissions
  - EMCON toggle on MPA (sensors on/off)
  - Active vs passive tradeoff becomes real

Quality gate: Turning on radar/active sonar feels risky. Players
              develop strategies around emission discipline.

Validates: The emission economy — the second core mechanic.


MILESTONE 5: "Second Asset" (Post-validation)
────────────────────────────────────────────
Build:
  - Destroyer entity (surface ship with sonar + weapons)
  - Basic combat resolution (torpedo engagement)
  - Kill chain: detect → classify → identify → authorize → engage → assess
  - BDA: post-strike sensor pass to confirm
  - Multi-entity management (MPA + Destroyer)

Quality gate: The kill chain is satisfying. Managing two assets
              creates interesting decisions about attention.

Validates: Combat as payoff for sensor work. Multi-entity management.
```

### Scaling Path: From 2D Canvas to Globe

The simulation layer doesn't change. Only the renderer swaps:

```
Phase       Renderer              When
──────────────────────────────────────────────
MVP         Canvas 2D             Milestones 0-5
Post-MVP    WebGL (deck.gl)       After core loop validated
Globe       CesiumJS on WebGL     After operational-scale works
Native      Godot (if needed)     Only if browser perf insufficient
```

The key architectural decision: **the simulation uses real coordinates
(lat/lon) from day one**, even though the MVP renders them on a flat 2D canvas
using a simple projection. When the globe renderer arrives, entities are already
positioned correctly — you swap the renderer, not the simulation.

```typescript
// Position is always lat/lon, even in 2D MVP
interface Position {
    lat: number;  // degrees
    lon: number;  // degrees
}

// The renderer projects to screen coordinates
// MVP: simple equirectangular projection
// Later: globe projection via CesiumJS
interface Renderer {
    worldToScreen(pos: Position): ScreenCoord;
    screenToWorld(coord: ScreenCoord): Position;
    render(state: GameState): void;
}
```

### File Structure (MVP)

```
swarm-commander/
├── docs/                          # Existing design docs (unchanged)
├── src/
│   ├── simulation/                # Pure game logic (no rendering)
│   │   ├── types.ts               # All type definitions
│   │   ├── state.ts               # GameState creation and management
│   │   ├── entities.ts            # Entity update logic
│   │   ├── sensors.ts             # Sensor detection, AOU, bearings
│   │   ├── tracks.ts              # Track management, quality, identity
│   │   ├── sonobuoys.ts           # Sonobuoy deployment and lifecycle
│   │   ├── tasking.ts             # Task assignment and autopilot
│   │   ├── mission.ts             # Win/lose conditions, objectives
│   │   ├── time.ts                # Game clock and time control
│   │   └── submarine-ai.ts        # Submarine patrol behavior
│   │
│   ├── renderer/                  # Visual output (swappable)
│   │   ├── canvas-renderer.ts     # 2D Canvas implementation
│   │   ├── camera.ts              # Pan/zoom controls
│   │   ├── draw-entities.ts       # Entity icon rendering
│   │   ├── draw-sensors.ts        # Bearing lines, AOU circles
│   │   ├── draw-ui.ts             # HUD elements, panels
│   │   └── colors.ts              # Theme/color constants
│   │
│   ├── input/                     # Player interaction
│   │   ├── input-handler.ts       # Mouse/keyboard event processing
│   │   ├── commands.ts            # Player command definitions
│   │   └── ui-state.ts            # UI panels, selection, mode
│   │
│   ├── audio/                     # Sound effects
│   │   └── audio-manager.ts       # Web Audio API wrapper
│   │
│   ├── data/                      # Static game data
│   │   ├── missions/              # Mission definitions (JSON)
│   │   │   └── mission-01.json    # "First Contact" scenario
│   │   ├── platforms.ts           # Platform specs (MPA, submarine)
│   │   └── sensors.ts             # Sensor specs (sonobuoy, radar, MAD)
│   │
│   ├── game.ts                    # Main game loop (tick simulation, render)
│   └── main.ts                    # Entry point, initialization
│
├── tests/
│   ├── sensors.test.ts            # Sensor detection tests
│   ├── tracks.test.ts             # AOU expansion/shrinking tests
│   ├── bearing.test.ts            # Bearing intersection math tests
│   ├── mission.test.ts            # Win/lose condition tests
│   └── submarine-ai.test.ts       # Submarine behavior tests
│
├── public/
│   ├── index.html                 # Single page shell
│   └── assets/                    # Icons, sounds
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### What Makes This Scale

**1. Simulation/Renderer separation.**
The simulation layer is pure TypeScript with no DOM or Canvas dependencies.
It can run in Node.js for testing, in a Web Worker for performance, or be
ported to any other language. The renderer is a thin layer that reads
GameState and draws pixels.

**2. Real coordinates from day one.**
Using lat/lon positions means the 2D prototype and the eventual 3D globe
use the same game state. No coordinate system migration.

**3. ECS-style components.**
Entities are data bags, not class hierarchies. Adding a new sensor type =
adding a new sensor spec to the data file. Adding a new entity type = adding
new component combinations. No inheritance trees to refactor.

**4. Deterministic simulation.**
`(state, inputs, dt) → newState` means replay, save/load, and networking
are architecturally possible from day one without retroactive redesign.

**5. Test coverage on game logic.**
Sensor detection, AOU math, bearing intersection, and track quality are
all pure functions that can be unit-tested. Game balance can be validated
by running simulations headlessly.

**6. Incremental complexity.**
Each milestone adds systems without changing existing ones. Sonobuoys
don't change when the tasking system is added. Tracks don't change when
combat is added. Systems compose, they don't entangle.

---

## Part 3: Immediate Action Items

### Must Do Before Writing Code

1. **Reconcile SENSOR_FUSION_SYSTEM.md with MVP_DESIGN.md.**
   The AOU model is the ground truth. Update SENSOR_FUSION_SYSTEM.md to use
   AOU-based detection instead of confidence floats. Keep the sensor specs
   table (it's good data) but reframe the accumulation formula to produce
   datum + error radius instead of confidence += delta.

2. **Delete or archive the `research docs/` directory.**
   It contains duplicates of files in `docs/`. Having two copies of
   SENSOR_FUSION_SYSTEM.md (one outdated) will cause confusion.

3. **Pick the tech stack and commit.**
   This document recommends TypeScript + Canvas 2D + Vite. If you disagree,
   pick something else. But pick before starting.

4. **Define the play area for Mission 1.**
   The current docs say "200km × 200km ocean area." Pick specific coordinates
   (e.g., a rectangle in the Philippine Sea). This grounds the MVP in real
   geography from day one and means the coordinate system is real from the
   start.

### Must NOT Do Yet

1. **Do not build the 3D globe.** Prove the fun in 2D first.
2. **Do not implement swarm AI.** The MVP has one aircraft.
3. **Do not implement combat.** Mission 1 has no weapons.
4. **Do not implement the economy.** Mission 1 has no resources beyond
   sonobuoy count and fuel.
5. **Do not implement the tech tree.** That's a Phase 4+ feature.
6. **Do not implement weather/terrain effects.** Mission 1 is clear weather,
   open ocean.
7. **Do not implement multiplayer, save/load, or replay.** But DO structure
   the code so these are possible later (deterministic simulation, serializable
   state).

---

## Part 4: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sensor puzzle isn't fun | Medium | Fatal | Milestone 3 is the gate. If it's not fun, redesign before building more. |
| 2D feels too abstract | Medium | Medium | The AOU model is inherently spatial/visual. If 2D isn't compelling, WebGL is a renderer swap, not a rewrite. |
| Performance at scale | Low (MVP) | High (later) | Web Worker for simulation. Canvas 2D handles hundreds of entities easily. |
| Scope creep | High | High | Milestone-gated development. Each milestone has a quality gate. No feature starts until the previous milestone passes. |
| Solo dev burnout | High | Fatal | Ship Milestone 3 as fast as possible. External playtesting creates motivation. Each milestone is a playable deliverable. |
| Tech stack wrong | Low | Medium | Simulation/renderer separation means the renderer can be swapped. The simulation layer is portable. |

---

## Part 5: Summary

### The Design Is Strong. The Architecture Needs Work.

The game vision is compelling, the research is thorough, and the core mechanic
(sensor fusion as puzzle) is genuinely interesting. The weaknesses are
architectural, not conceptual:

1. **Two competing MVP visions** → Resolve by building the simpler one first.
2. **Confidence floats vs AOU** → Resolve by making AOU the ground truth.
3. **No tech stack decision** → Resolve by choosing TypeScript + Canvas 2D.
4. **Timeline-based roadmap** → Replace with milestone-gated development.
5. **Over-specified future systems** → Keep as reference, don't build yet.

The path to a scalable MVP:

```
Prove the fun (Milestones 0-3, ~8500 lines)
    ↓
Add the emission economy (Milestone 4)
    ↓
Add combat (Milestone 5)
    ↓
Swap renderer to WebGL/Globe (when 2D is limiting)
    ↓
Add operational scale (swarms, economy, weather)
    ↓
Full campaign (theater scale)
```

Each step builds on the last. Nothing is thrown away. The simulation core
written for Milestone 0 survives into the final game.

**Build the smallest thing. Prove it's fun. Then scale.**
