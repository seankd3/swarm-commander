# Development Roadmap — Milestone-Gated

> **Philosophy:** Ship something playable as fast as possible. Get playtester feedback. Iterate.
> Every milestone produces a playable build. No milestone starts until the previous one passes its quality gate.
> No time estimates — only quality gates.

---

## Architecture

### Simulation/Renderer Separation

The game is built as two independent layers:

**Simulation layer** (pure TypeScript, no rendering):
- All game logic, sensor math, entity updates, track management
- Pure function: `(state, inputs, deltaTime) -> newState`
- Runs in Node.js for testing, browser for play
- Deterministic — same inputs always produce same outputs
- Enables: unit tests, save/load, replay, future multiplayer

**Rendering layer** (swappable):
- Reads GameState, draws pixels
- Phase 1: HTML5 Canvas 2D
- Phase 2: WebGL (deck.gl or Three.js) — when 2D is limiting
- Phase 3: CesiumJS globe — when operational scale demands it

### Coordinates

Real lat/lon (WGS84) from day one. The 2D renderer uses equirectangular projection. When the globe arrives, it's a renderer swap — the simulation doesn't change.

### Tech Stack

- TypeScript + Vite (bundler) + Vitest (testing)
- HTML5 Canvas 2D (renderer)
- Web Audio API (sound)
- No game engine. No external dependencies beyond build tools.

---

## Milestone 0: "Something on Screen"

### Deliverables

- Vite + TypeScript project scaffold
- Canvas 2D renderer: ocean background with grid
- Camera: pan (click-drag) and zoom (scroll wheel)
- Equirectangular projection (lat/lon → screen pixels)
- MPA entity: icon with heading indicator, smooth movement
- Click-to-move: click map → MPA flies to clicked position
- Game clock: pause / 1x / 5x / 20x speed
- Time controls UI: buttons + keyboard shortcuts (Space=pause, 1/2/3=speeds)
- HUD: mission clock, speed indicator, MPA status

### Quality Gate

An aircraft icon flies around a dark blue ocean. Pan and zoom work smoothly. Time controls work. Pausing freezes the aircraft. Speeding up makes it fly faster.

---

## Milestone 1: "Sonar Contact"

### Deliverables

- Submarine entity: follows a patrol route, changes speed/signature states
- Passive sonobuoy: deploy via click, renders as green circle on map
- Detection check: does sonobuoy detect submarine? (range × signature)
- Bearing line: when passive buoy detects, draw line from buoy toward target
- Bearing error: ±3° randomized, so line doesn't point exactly at target
- Bearing intersection: two bearings from different buoys → datum position
- AOU circle: renders around datum, visibly expands over time
- Track panel: shows active tracks with AOU radius and quality state
- Sonobuoy inventory: shows remaining count

### Quality Gate

Player can drop passive sonobuoys, see bearing lines appear when the submarine is in range, watch two bearings intersect to form a datum, and see the AOU circle form and expand. The core triangulation puzzle is visible and understandable.

---

## Milestone 2: "The Hunt"

### Deliverables

- Active sonobuoy: ping on command, gives range + bearing (position fix)
- Surface radar: MPA radar detects snorkel/periscope mast
- MAD sensor: fly-over detection, very precise (±100m)
- Submarine signature states: silent (0.3) / transit (1.0) / snorkel (3.0)
- Submarine snorkel schedule: silent 45min → transit 30min → snorkel 15min
- Sonobuoy inventory: 12 passive, 8 active (20 total)
- Fuel system: 4-hour MPA endurance, fuel gauge in HUD
- Sensor mode indicators on MPA icon (radar on/off)

### Quality Gate

All four sensor types work and feel different. Passive buoys give slow but safe bearing data. Active buoys give fast position fixes. Radar catches the sub when it snorkels. MAD confirms on fly-over. The submarine's behavior creates windows of opportunity. Limited buoys force real decisions.

---

## Milestone 3: "Mission Complete"

### Deliverables

- Tasking system: Search Area, Patrol Route, Investigate, Deploy Buoy
- MPA autopilot: executes search patterns, follows routes, orbits points
- Track quality: Tentative (1-10nm AOU) / Firm (< 1nm) / Lost (> 10nm)
- Identity states: Unknown → Classified → Identified
- Classification logic: sonar → subsurface, radar → surface, MAD → confirms sub
- Identification logic: 30s sustained acoustic OR multi-sensor confirmation
- Win condition: Firm Track + Identified (simultaneously)
- Lose conditions: time expires / sub exits / track permanently lost
- Mission briefing screen (scenario setup, objectives, assets)
- Results screen: time to first contact, buoys used, track history, grade
- Basic audio: buoy splash, passive detection ping, active ping, track alerts
- Tooltip system: hover over any element for explanation

### Quality Gate

Complete, playable Mission 1. A playtester can start the mission, hunt the submarine using all available sensors and tasking modes, and win or lose. They understand why they succeeded or failed. The sensor puzzle is satisfying.

**THIS IS THE VALIDATION GATE.** If playtesters don't find this fun, stop and redesign before building more.

---

## Milestone 4: "The Emission Economy"

> Only start after Milestone 3 playtesting confirms the fun.

### Deliverables

- Submarine reacts to active sensors (goes silent, changes course, evades)
- The 2x rule: submarine detects active sonobuoys at 16nm, radar at 160nm
- RWR concept: submarine "hears" your pings and radar
- Evasion AI: submarine sprints away from active sensor source
- EMCON toggle on MPA: radar on/off as a deliberate choice
- Active sonobuoy tradeoff: precise data but alerts the target
- New lose condition: submarine successfully evades all tracking

### Quality Gate

Turning on active sensors feels risky. Players develop strategies around emission discipline — when to go active vs stay passive. The cat-and-mouse dynamic emerges. The submarine is a thinking opponent, not a target.

---

## Milestone 5: "Second Asset"

### Deliverables

- Destroyer entity (surface ship with hull sonar + weapons)
- Basic combat resolution: torpedo engagement (if Track quality Firm)
- Kill chain flow: detect → classify → identify → authorize → engage → assess
- BDA: post-strike sensor pass to confirm kill
- Authorization prompt: player must approve weapons release
- Multi-entity attention: MPA + Destroyer competing for player focus
- Asset switching UI (select active asset)

### Quality Gate

The kill chain is satisfying. The sensor work pays off in a reliable engagement. Managing two assets creates interesting attention-splitting decisions. Combat is the payoff for sensor work, not the main event.

---

## Future Milestones (Not Scheduled)

These are designed but not built until earlier milestones validate the fun.

### Multiple Contacts
- 2-3 submarines in the area
- Track management: maintain multiple simultaneous tracks
- Sensor allocation: which contacts get which resources

### Weather & Environment
- Sea state affects sonar ranges
- Rain/fog affects radar
- Weather overlay on tactical display

### Electronic Warfare
- Jamming, deception, counter-EW
- WHISPER EW platform
- Full emission economy with ARMs

### Multi-Swarm / Operational Scale
- Multiple asset groups with behavioral parameters
- Autonomy slider, approval queue
- Economy & logistics (Compute Cycles, Manufacturing, etc.)

### Globe & Theater Scale
- 3D globe renderer (CesiumJS) replacing Canvas 2D
- Multiple theaters (Taiwan Strait, Arctic, Baltic, etc.)
- Full campaign (20+ missions)
- Seamless zoom from orbital to tactical

---

## Playtesting Protocol

Every milestone gets external playtesting. The critical question each time:

1. **"Did you understand what to do without being told?"** → If no, UI/tutorial needs work.
2. **"Was the sensor puzzle engaging?"** → If no, core mechanic needs redesign.
3. **"Would you play again?"** → If no, pacing/feedback needs work.
4. **"What confused you?"** → Direct input for next iteration.

Playtest after every milestone. Do not skip this. The first playtest will invalidate assumptions — that's the point.
