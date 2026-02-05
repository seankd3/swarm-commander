# Game Research — Lessons Synthesis

> Distilled design lessons from all analyzed games, organized by what NEXUS should adopt, adapt, or avoid.

---

## The One Rule From Each Game

| Game | The Lesson | Application to NEXUS |
|------|-----------|---------------------|
| **HOI4** | Time control IS the UX. Pause-plan-execute is the core loop. | Variable time step with Active Pause. All commands available while paused. |
| **CMO** | Detection is a progression, not a binary. | 5-state confidence model: Undetected → Anomaly → Contact → Track → Identified |
| **Highfleet** | ELINT range > Radar range creates perfect tension. | The emission economy. Every radar ping is a decision. |
| **VTOL VR** | Sensor modes should FEEL different to use. | TWS vs STT distinction. Audio/visual feedback per sensor mode. |
| **PA: Titans** | Globe-scale works if icons simplify at distance. | Strategic zoom with progressive icon abstraction. PIP for multi-theater. |
| **Rimworld** | Simple individual systems + intersections = depth. | Each system standalone-simple, but weather × terrain × sensors × EW = emergence. |
| **SupCom** | Radar → Intel → Omni is a satisfying sensor progression. | Tiered sensor capability through tech tree investment. |
| **DEFCON** | Not seeing is the game. Information scarcity creates tension. | Fog of war is the default state. Clarity is earned through effort. |

---

## Detailed Lessons

### From Hearts of Iron IV

**ADOPT:**
- **5-speed time control + pause.** HOI's speed system (1/2/3/4/5 + pause) is the gold standard for strategic games. Players use speed 5 for boring stuff, speed 2 for active management, pause for critical decisions. NEXUS needs the same: 1x (real-time), 3x, 10x, 30x, 100x + pause.
- **Active Pause.** Full UI access while paused. Queue orders, adjust parameters, plan waypoints — all while time is frozen. This is non-negotiable.
- **Interlocking systems that create strategic tension.** HOI's combat → supply → railways → factories → research chain creates meaningful decisions because improving one thing has cascading effects. NEXUS: sensors → detection → kill chain → weapons → logistics → manufacturing → sensors.
- **Map modes.** Different overlay modes showing different data layers. HOI has supply, air, weather, political, strategic. NEXUS: sensor coverage, threat assessment, weather, logistics, political boundaries, EW spectrum.
- **Tooltips that explain the math.** HOI's tooltips show exactly why a division has +15% attack or -30% supply. NEXUS must show why detection confidence is at 67% (which sensors contributing what).

**AVOID:**
- **The learning cliff.** HOI dumps everything at once. NEXUS progressive-discloses.
- **Opaque failure states.** When your HOI army collapses, it's often unclear why (supply? org? equipment? terrain? air support?). NEXUS must make cause-of-failure explicit.
- **UI density without hierarchy.** HOI's interface is dense but poorly hierarchized. Critical info and trivia share equal visual weight. NEXUS must ruthlessly prioritize.

### From Command: Modern Operations

**ADOPT:**
- **Three-tier detection model.** Detection → Classification → Identification. Each tier requires different sensor investment and time. This is the most realistic and gameable detection model in any simulation.
- **Sensor-specific detection contributions.** Each sensor type contributes to detection confidence at different rates for different target types. Radar is fast for aircraft, slow for ground vehicles. EO/IR is slow for aircraft, fast for ground vehicles. This creates meaningful sensor selection.
- **EMCON (Emission Control) settings.** CMO lets you set fleet-wide emission policies: Tight (nothing emits), Limited (defensive sensors only), Active (all sensors). NEXUS needs swarm-level EMCON profiles.
- **The database.** CMO's platform database (cmo-db.com) contains real specs for thousands of platforms. NEXUS doesn't need that depth, but each platform should have clearly defined sensor capabilities and signatures.

**ADAPT:**
- **CMO's complexity is a feature for its audience but a bug for ours.** CMO targets hard-core military sim enthusiasts. NEXUS targets "people who watch Perun but bounced off CMO." Take the detection model, simplify the parameter count.
- **CMO's time system is weird** (it uses a custom variable-rate real-time that can feel sluggish). Use Paradox-style discrete ticks instead.

### From Highfleet

**ADOPT (HIGH PRIORITY):**
- **The 2x ELINT rule.** ELINT detects radar at roughly 2x the radar's detection range. Simple, elegant, creates perfect tension. This MUST be the foundation of NEXUS's emission economy.
- **The sensor triangle: Radar ↔ ELINT ↔ IRST.** Each counters and complements the others. Radar sees everything but is loud. ELINT sees radar but not silent targets. IRST sees silent targets but only up close.
- **Anti-radiation weapons.** Missiles that home on radar emissions. Forces the choice: keep radar on for SA but risk eating an ARM, or go dark and lose awareness.
- **Jammers as double-edged swords.** Jamming blinds enemy radar but makes you the brightest thing on ELINT. Beautiful risk-reward mechanic.

**ADAPT:**
- Highfleet is 2D and relatively small-scale. NEXUS needs this emission economy at globe scale with thousands of emitters.
- Highfleet's IRST is short-range scout-only. NEXUS can expand IRST to longer ranges (real IRST reaches 150+ km) while keeping the tradeoff structure.

### From VTOL VR

**ADOPT:**
- **Radar modes that matter.** TWS vs STT isn't just labels — it changes what the target sees on their RWR. TWS is "quiet" engagement; STT is "loud" but more reliable. Map this to NEXUS's sensor modes.
- **Datalink visualization.** VTOL VR shows contacts from AWACS as hollow symbols vs your own radar contacts as filled. Player instantly sees what they know themselves vs what the network tells them. NEXUS must show "own sensor" vs "network-shared" tracks differently.
- **RWR audio feedback.** Different sounds for different threat levels (search ping, track, lock, missile launch). Audio cues free visual attention. NEXUS needs tiered audio alerts for sensor events.
- **The satisfaction of "sorting" a picture.** Starting with unknown contacts and progressively identifying each one is inherently satisfying. This is basically a puzzle game with military theming.

### From Planetary Annihilation: Titans

**ADOPT:**
- **Seamless strategic zoom.** No separate strategic and tactical maps. One continuous zoom from orbital to ground level. This is essential for the "globe as interface" concept.
- **Strategic icons at distance.** Units become NATO-style icons at strategic zoom. Formations become single icons with unit count. Only resolve to individual units at tactical zoom.
- **Picture-in-Picture.** A functional secondary viewport that can show a different location. Essential for managing multiple theaters. Let it auto-switch to show alerts.
- **The "planet is the map" feel.** PA proves that a spherical map works for RTS. The globe isn't a gimmick — it creates natural choke points (straits, mountain ranges) and strategic geography.

**ADAPT:**
- PA doesn't have meaningful fog of war beyond basic vision range. NEXUS layers probabilistic detection on top of PA's zoom system.
- PA's economy is simple (metal + energy). NEXUS needs the 5-resource system for strategic depth.

### From Rimworld

**ADOPT (CRITICAL FOR PHILOSOPHY):**
- **Simple systems, complex intersections.** Each Rimworld system is trivially simple alone: temperature is a number, mood is a bar, health is a list. The DEPTH comes from how they intersect. Temperature → crop growth → food → mood → mental breaks → violence. NEXUS must follow this pattern: each system is simple, but sensor range × weather × terrain × EMCON × target signature × time = emergent complexity.
- **Storyteller pacing.** Rimworld's AI directors (Cassandra/Randy/Phoebe) control event pacing — not scripted events, but difficulty curves. NEXUS campaign scenarios should have similar pacing: tension builds, crisis hits, resolution, breathing room, repeat.
- **Pause-at-will.** Rimworld players pause constantly. It's part of the design, not a crutch. NEXUS should celebrate pausing as smart command behavior.
- **Tooltips that chain.** Rimworld's tooltips show "Mood: -15. Why? Cold: -8 (temperature 3°C in bedroom). Hungry: -4. Saw corpse: -3." Each factor links to its cause. NEXUS: "Detection confidence: 67%. Radar: +40% (SPECTER-3, 45 km). IR correlation: +15% (SPECTER-7, 12 km). Time decay: -8% (12 seconds since last update). Weather penalty: -5% (light rain)."

### From Supreme Commander

**ADOPT:**
- **Three-tier sensor hierarchy.** SupCom's Vision → Radar → Omni progression creates investment decisions. NEXUS: Basic Sensors → Enhanced Sensor Fusion → Omniscience (capstone tech that defeats stealth/jamming in limited area).
- **Radar jamming as player-visible effect.** When jammed, radar shows static/noise in the affected area. Player can see that they're being jammed. Creates urgency to address the EW threat.
- **Strategic icons.** SupCom pioneered the "detailed 3D model at close zoom, clean icon at far zoom" pattern that PA inherited.

### From DEFCON

**ADOPT:**
- **Information scarcity as tension.** DEFCON proves that NOT knowing is more stressful than knowing. The moment before you identify an incoming contact is more compelling than the engagement itself. NEXUS should maximize the time spent in uncertainty.
- **Radar coverage as territory.** In DEFCON, your radar coverage IS your territory — it's where you can see and respond. Outside it, you're blind. NEXUS: sensor coverage = operational control.
- **Minimalist UI aesthetic.** DEFCON's dark screen with glowing contacts is visually iconic. NEXUS's Palantir-inspired dark UI should evoke the same controlled-information aesthetic.

---

## Anti-Patterns to Avoid (Across All Games)

1. **Information Overload (HOI4):** Don't show everything at once. Progressive disclosure.
2. **Unclear Causation (HOI4):** When something goes wrong, explicitly show why.
3. **Impenetrable Complexity (CMO):** Every system must be learnable through play.
4. **Micro-Management Taxing (StarCraft):** Players command swarms, not individual units.
5. **Invisible Math (most games):** Show the formulas in tooltips. Players who care can see exactly why sensor range is 83 km in these conditions.
6. **Tutorial Walls (most games):** Never interrupt gameplay with a tutorial popup. Teach through mission design and contextual advisor hints.

---

## Design Principles Distilled

1. **The Emission Economy is the game** (Highfleet)
2. **Detection is a gradient, not a binary** (CMO)
3. **Time control is the primary UI** (HOI4)
4. **Simple systems × intersections = depth** (Rimworld)
5. **Not seeing is more compelling than seeing** (DEFCON)
6. **Zoom is continuous, icons scale with distance** (PA: Titans)
7. **Sensor modes should feel different** (VTOL VR)
8. **Show the math in tooltips** (Rimworld + HOI4)
9. **Teach through play, never through popups** (Rimworld campaign structure)
10. **The globe is the game, not a menu** (PA: Titans)
