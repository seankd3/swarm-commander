# MVP Design — Mission 1: "First Contact"

> **One aircraft. One submarine. One question: Can you find it?**
>
> Build the smallest thing that proves the core sensor gameplay is fun.
> Strip away everything that isn't essential. Add complexity in later missions.

---

## The Pitch

You command a single maritime patrol aircraft hunting a diesel submarine somewhere in a 200km x 200km ocean area. You have 2 hours. Find it before it escapes.

No combat. No stakes beyond the clock. Just pure sensor gameplay.

**If this isn't satisfying, nothing else matters.**

---

## Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| **Language** | TypeScript | Fast iteration, AI-agent friendly, runs everywhere |
| **Simulation** | Pure functions, no rendering deps | Testable, portable, deterministic |
| **Renderer** | HTML5 Canvas 2D | Fastest path to playable. Swappable later. |
| **Coordinates** | Lat/lon (WGS84) from day one | Globe migration = renderer swap, not rewrite |
| **Bundler** | Vite | Fast HMR, TypeScript-native |
| **Testing** | Vitest | Simulation layer is pure functions — easy to test |
| **Deployment** | Static site (browser) | Zero install. Share a URL to playtest. |

### Why Not Godot / 3D Globe for MVP

- The MVP is a 2D tactical display. Canvas 2D is the fastest path.
- Browser-first = instant playtesting (URL, not .exe).
- If the sensor puzzle isn't fun in 2D, a 3D globe won't save it.
- Simulation/renderer separation means the globe is a renderer swap later.

---

## Play Area

**Philippine Sea, east of Luzon** — a real-world ASW-relevant area.

```
Northwest corner: 16.0°N, 126.0°E
Southeast corner: 14.0°N, 128.0°E
Size: ~200km × 200km (108nm × 108nm)
```

Using real coordinates from day one means entities are correctly positioned when the globe renderer arrives.

---

## Player Asset: Maritime Patrol Aircraft

Based on P-8 Poseidon. One aircraft, fully under player control.

### Sensors

| Sensor | Type | Range | Output | Base Error | Notes |
|--------|------|-------|--------|------------|-------|
| **Passive Sonobuoy** | Passive | 15nm | Bearing only | ±3° | Drop in water. Listens. No emission. |
| **Active Sonobuoy** | Active | 8nm | Range + bearing | ±200m | Pings. Target hears it. |
| **Surface Radar** | Active | 80nm | Range + bearing | ±500m | Detects periscope/snorkel only. |
| **MAD** | Passive | 500m | Fly-over confirm | ±100m | Must fly directly over target. |

### Capabilities

- Flies anywhere in the play area at ~250 knots
- Carries 20 sonobuoys (12 passive, 8 active)
- 4 hours endurance (fuel)
- Can be tasked with missions (Search Area, Patrol Route, Investigate, Deploy Buoy)

### Limitations

- Only one aircraft — can't be everywhere
- Sonobuoys are expendable — limited supply
- MAD requires flying directly over target — need good position estimate first
- Radar only detects snorkel/periscope (intermittent submarine states)

---

## Target: Diesel Submarine

Based on Kilo-class. AI-controlled, follows patrol route.

### Behavior (Mission 1 — Simple)

- Follows a patrol route through the area
- Periodically surfaces to snorkel (charge batteries) — louder signature
- **Does NOT react to player sensors** (evasion comes in Milestone 4)
- If player doesn't find it, eventually exits the area

### Signature Profile

| State | Acoustic Signature | Radar Signature | Duration |
|-------|-------------------|----------------|----------|
| **Silent running** | 0.3 (very low) | 0.0 (submerged) | ~45 min |
| **Transit speed** | 1.0 (baseline) | 0.0 (submerged) | ~30 min |
| **Snorkeling** | 3.0 (high) | 0.5 (mast exposed) | ~15 min |

Submarine cycles: silent → transit → snorkel → silent (repeating).

### Movement

- Max speed: 8 knots (4.1 m/s) — this drives AOU expansion rate
- Patrol route: 4-6 waypoints within the play area
- Route takes ~3 hours to complete

---

## Win/Lose Conditions

**Win:** Submarine reaches **Firm Track + Identified** status:
- Track quality: Firm (AOU < 1nm)
- Identification: Confirmed hostile submarine class
- Both must be true simultaneously

**Lose:**
- Time expires (2 hours game time)
- Submarine exits patrol zone while track is Lost
- MPA runs out of fuel (4-hour endurance, but 2-hour mission — only matters if player wastes fuel)

---

## Core Mechanics

### 1. Tasking System

Player gives the MPA missions, not waypoints:

| Task | How to Assign | What MPA Does |
|------|---------------|---------------|
| **Search Area** | Draw rectangle on map | Flies ladder pattern, optimized for sensor coverage |
| **Patrol Route** | Click waypoints | Follows route with radar scanning |
| **Investigate** | Click location | Flies to point, orbits, focuses sensors |
| **Deploy Buoy** | Click water location | Flies to point, drops sonobuoy |

**No micro-management.** High-level orders only. MPA autopilot handles the details.

### 2. Area of Uncertainty (AOU)

See SENSOR_FUSION_SYSTEM.md for full spec. Summary:

- Datum = last known position + timestamp
- AOU = circle showing where target could be now
- `aou_radius = sensor_error + (time_since_datum × target_max_speed)`
- AOU grows every tick. New sensor data shrinks it.
- Track quality: Firm (< 1nm) / Tentative (1-10nm) / Lost (> 10nm)

### 3. Sonobuoy Mechanics

- **Passive:** Listens continuously. Bearing only. No emission.
- **Active:** Pings on command. Range + bearing. Target hears the ping.
- Player builds a sonobuoy net to triangulate position
- Single passive buoy → bearing line (infinite possibilities)
- Two passive buoys → bearing intersection (datum created)
- Active ping → direct position fix (precise datum)

### 4. Identity States

| State | How Achieved |
|-------|-------------|
| **Unknown** | Any detection |
| **Classified** | Sonar contact → subsurface. Radar contact → surface. |
| **Identified** | Sustained acoustic contact (30s) OR MAD confirm + acoustic |

### 5. Time Control

| Control | Speed | Use |
|---------|-------|-----|
| **Pause** | 0x | Issue orders, analyze contacts |
| **Normal** | 1x | Critical moments |
| **Fast** | 5x | Transit, waiting for detection |
| **Very Fast** | 20x | Skip to next event |

All orders available while paused (Active Pause).

---

## UI Layout

Dark background, glowing elements. Command center aesthetic.

```
+----------------------------------------------------------+
|  MISSION: First Contact         TIME: 01:23:45 / 02:00:00|
|  [|| PAUSE] [> 1x] [>> 5x] [>>> 20x]                    |
+----------------------------------------------------------+
|                                                           |
|     [MAP AREA - 2D TACTICAL DISPLAY]                     |
|                                                           |
|     ^ MPA-1                   Bearing lines from          |
|                              / passive sonobuoys          |
|     o Buoy-1 ---------------/---------->                  |
|                            X (intersection = datum)       |
|     o Buoy-2 -------------/                               |
|                         .---.                             |
|                         |AOU| <-- Expanding circle        |
|                         | ? |     (dashed = tentative)    |
|                         '---'                             |
|                                                           |
+----------------------------------------------------------+
|  MPA-1 "Hunter"                                           |
|  Status: Searching Area Alpha                             |
|  Fuel: 3:15 remaining | Buoys: 14/20 (10P 4A)           |
|                                                           |
|  [SEARCH] [PATROL] [INVESTIGATE] [DROP BUOY]             |
+----------------------------------------------------------+
|  TRACKS                                                   |
|  o TRK-1: TENTATIVE | Unknown | AOU: 3.2nm              |
|           Datum: 15.2N 127.1E @ 14:23                    |
|           Last update: 12 min ago (expanding)             |
+----------------------------------------------------------+
```

### Visual Elements

- **Ocean:** Dark blue background
- **MPA:** Bright aircraft icon with heading indicator and trail
- **Sonobuoys:** Small circles (green = passive, orange = active)
- **Bearing lines:** Lines from passive buoys toward contact
- **AOU circles:** Dashed (tentative) or solid (firm), visibly expanding
- **Bearing intersections:** Highlighted X where lines cross
- **Track icons:** ? (unknown), submarine silhouette (classified), full ID (identified)

---

## What Mission 1 Teaches

1. **How to task aircraft** — area search, patrol, investigate
2. **How sonobuoys work** — passive for bearing, active for range
3. **How AOU works** — uncertainty grows, shrinks with new data
4. **Triangulation** — two bearings = position fix
5. **Track vs Identification** — knowing WHERE vs knowing WHAT
6. **Resource management** — limited buoys, limited fuel, limited time

---

## Expansion Path

```
Mission 1: Find submarine (sensor puzzle) ← YOU ARE HERE
    |
    v
Milestone 4: Submarine reacts to active sensors (emission economy)
    |
    v
Milestone 5: Destroyer + weapons (kill chain)
    |
    v
Future: Multiple contacts, weather, EW, multi-swarm, globe
```

Each milestone adds ONE new concept. Players learn by playing.
