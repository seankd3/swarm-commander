# MVP Design — Minimum Playable Game

> **Philosophy:** Inspired by Planetary Annihilation: Titans — simplification through removal.
> Build the smallest thing that proves the core sensor gameplay is fun.
> Strip away everything that isn't essential. Add complexity in later missions.

---

## True MVP: Mission 1 — "First Contact"

**One aircraft. One submarine. One question: Can you find it?**

### The Pitch

You command a single maritime patrol aircraft hunting a diesel submarine somewhere in a 200km × 200km ocean area. You have 2 hours. Find it before it escapes.

No combat. No stakes beyond the clock. Just pure sensor gameplay.

**If this isn't satisfying, nothing else matters.**

---

## Player Asset: Maritime Patrol Aircraft

Based on P-8 Poseidon. One aircraft, fully under player control.

### Sensors

| Sensor | Type | Range | How It Works |
|--------|------|-------|--------------|
| **Passive Sonobuoy** | Passive | 15nm | Drop in water. Listens for submarine noise. No emission. Bearing-only data. |
| **Active Sonobuoy** | Active | 8nm | Drop in water. Pings. Gets range + bearing. Submarine hears the ping. |
| **Surface Radar** | Active | 80nm | Detects periscope/snorkel mast. Submarine's RWR detects your radar. |
| **MAD** | Passive | 500m | Fly directly over submarine to detect magnetic anomaly. Confirms location. |

### Capabilities

- Can fly anywhere in the play area
- Carries 20 sonobuoys (mixed passive/active)
- 4 hours endurance (fuel)
- Can be tasked with missions (search area, patrol route, investigate point)

### Limitations

- Only one aircraft — can't be everywhere
- Sonobuoys are expendable — limited supply
- MAD requires flying directly over target — need good position estimate first

---

## Target: Diesel Submarine

Based on Kilo-class. AI-controlled, follows patrol route.

### Behavior (Mission 1 — Simple)

- Follows a patrol route through the area
- Periodically surfaces to snorkel (charge batteries) — louder signature
- **Does NOT react to player sensors** (evasion comes in Mission 2)
- If player doesn't find it, eventually exits the area

### Signature Profile

| State | Acoustic Signature | Detection Difficulty |
|-------|-------------------|---------------------|
| **Silent running** | Very low | Hard — need close sonobuoys |
| **Transit speed** | Low | Medium — detectable at moderate range |
| **Snorkeling** | High | Easy — very detectable |

---

## Win/Lose Conditions

**Win:** Submarine reaches **Firm Track + Identified** status:
- Track quality: Firm (multiple sensor confirmations, AOU < 1nm)
- Identification: Confirmed hostile submarine class

**Lose:**
- Time expires (2 hours game time)
- Submarine exits patrol zone
- Track goes Lost (AOU expands beyond playable area)

---

## Core Mechanics (MVP Only)

### 1. Tasking System

Player gives the MPA missions, not waypoints:

| Mission | How to Assign | What MPA Does |
|---------|---------------|---------------|
| **Search Area** | Draw rectangle on map | Flies systematic pattern, drops sonobuoys, listens |
| **Patrol Route** | Draw line/waypoints | Follows route, radar scanning |
| **Investigate Point** | Click location | Flies there, circles, focuses sensors |
| **Deploy Sonobuoy** | Click water location | Drops sonobuoy at that point |

**No micro-management.** High-level orders only.

### 2. Area of Uncertainty (AOU) System

Based on real-world ASW tracking doctrine. No abstract percentages — just physics.

#### Core Concept: The Target Could Have Moved

When you detect something, you know where it WAS, not where it IS. The submarine keeps moving after your last detection. Your uncertainty about its current position grows over time.

#### Datum
The **datum** is the last known position — where you detected the target, and when.
- Example: "Detected at position 34.5°N 127.2°E at 14:23:15"
- This is FACT — you know the submarine was here at this time

#### Area of Uncertainty (AOU)
The AOU is a circle (or ellipse) showing where the target COULD BE NOW, given:
- Its last known position (datum)
- Time elapsed since detection
- Target's maximum possible speed

```
AOU Radius = Time Since Detection × Target Max Speed
```

**Example:** Submarine max speed = 8 knots. Last detection 15 minutes ago.
- AOU radius = 15 min × 8 kts = 2 nautical miles
- The submarine is SOMEWHERE in that 2nm circle

#### How AOU Shrinks

New sensor data creates a **new datum**, resetting the clock:
- Fresh detection → AOU shrinks to sensor accuracy
- Multiple sensors detecting → AOU intersection (smaller area)
- MAD pass → Very small AOU (you flew right over it)

#### Bearing Lines (Passive Sensors)

Passive sonobuoys give **bearing only** — direction, not distance:
- Single bearing = infinite line from sensor toward contact
- Two bearings from different positions = intersection point (position fix)
- More bearings = better fix (lines should converge)

```
Single sonobuoy: "Contact bearing 045° from buoy"
Two sonobuoys: "Bearing intersection at 34.5°N 127.2°E"
```

#### Track Quality States

| State | Meaning | Display |
|-------|---------|---------|
| **Tentative** | Initial detection, unconfirmed | Dashed AOU circle, "?" icon |
| **Firm** | Multiple confirmations, good track | Solid AOU circle, heading arrow |
| **Lost** | AOU expanded beyond useful size | Faded circle, no updates |

Track quality is about **localization** — how well you know WHERE it is.

#### Identification States

Separate from track quality — this is about WHAT it is:

| State | Meaning | Display |
|-------|---------|---------|
| **Unknown** | Something's there | Generic contact icon |
| **Classified** | Domain known (submarine vs surface) | Domain-specific icon |
| **Identified** | Type known (Kilo-class, hostile) | Full icon with classification |

**You can have a Firm track on an Unknown contact** (you know exactly where it is, but not what it is).
**You can have Identified but Lost** (you know it's a Kilo-class, but lost track of its current position).

### 3. Sonobuoy Mechanics

Sonobuoys are dropped in water and persist:

- **Passive:** Listens continuously. Gives **bearing only** (direction, not range). No emission. Draw bearing lines on map.
- **Active:** Pings on command. Gives **range + bearing** (position fix). Creates new datum. Target hears the ping.

Player builds a **sonobuoy net** to triangulate position:
- Single passive buoy → bearing line (infinite possibilities along that line)
- Two passive buoys → bearing intersection (position estimate, creates datum)
- Active ping → direct position fix (precise datum, but submarine is alerted)

### 4. The Sensor Tradeoff (Simplified for Mission 1)

- **Passive:** Slower but stealthy
- **Active:** Faster but uses expendable resources

In Mission 1, the submarine doesn't react to active sensors — the tradeoff is resource management (limited sonobuoys) rather than alerting the enemy. Mission 2 adds the full emission economy.

### 5. Time Control

- **Pause:** Issue orders, analyze contacts. Full control while paused.
- **1×:** Real-time. For critical moments.
- **5×:** Faster. For transit and waiting.
- **20×:** Much faster. Skip to next event.

---

## UI Design: Tactical Display

Dark background, glowing elements. Command center aesthetic inspired by Palantir/Anduril C2 systems.

```
┌─────────────────────────────────────────────────────────┐
│  MISSION: First Contact          TIME: 01:23:45 / 02:00│
│  [▶ 1×] [▶▶ 5×] [▶▶▶ 20×] [⏸ PAUSE]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     [MAP AREA - 2D TACTICAL DISPLAY]                   │
│                                                         │
│     ✈ MPA-1                    Bearing lines from      │
│                               / passive sonobuoys      │
│     ● Buoy-1 ────────────────/──────→                  │
│                             ╳ (intersection)            │
│     ● Buoy-2 ──────────────/                           │
│                          ╭───╮                         │
│                          │AOU│ ← Circle showing        │
│                          │ ? │   possible target area  │
│                          ╰───╯                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  MPA-1 "Hunter"                                         │
│  Status: Searching Area Alpha                           │
│  Fuel: 3:15 remaining | Sonobuoys: 14/20               │
│                                                         │
│  [SEARCH] [PATROL] [INVESTIGATE] [DROP BUOY]           │
├─────────────────────────────────────────────────────────┤
│  TRACKS                                                 │
│  ◯ TRK-1: TENTATIVE | Unknown | AOU: 3.2nm            │
│           Datum: 34.5°N 127.2°E @ 14:23                │
│           Last update: 12 min ago (AOU expanding)      │
└─────────────────────────────────────────────────────────┘
```

### Visual Elements

- **Ocean:** Dark blue, minimal texture
- **MPA:** Glowing aircraft icon with heading indicator
- **Sonobuoys:** Small circles. Passive = green, Active = orange
- **Bearing lines:** Lines extending from passive sonobuoys toward detected contact
- **AOU circles:** Dashed circle (tentative) or solid (firm) showing possible target location
- **AOU expansion:** Circle visibly grows over time when no new detections
- **Bearing intersections:** Highlighted where multiple bearing lines cross
- **Track icons:** Change based on identification state (?, submarine silhouette, full ID)

---

## What Mission 1 Teaches

After completing Mission 1, the player understands:

1. **How to task aircraft** — area search, patrol, investigate
2. **How sonobuoys work** — passive for bearing, active for range
3. **How AOU works** — uncertainty grows over time, shrinks with new data
4. **Triangulation** — two bearing lines = position fix
5. **Track vs Identification** — knowing WHERE vs knowing WHAT
6. **Basic EMCON concept** — active vs passive (full depth in Mission 2)

---

## Mission 2: "Hunter and Hunted" (Next Phase)

Once Mission 1 is fun, Mission 2 adds:

- **Destroyer** — Player's second asset. Has weapons. Is vulnerable.
- **Submarine reacts** — Goes silent, evades when it detects active sensors
- **Full emission economy** — Active sensors alert the enemy
- **Kill chain** — Find → Track → Authorize → Engage → Assess
- **Stakes** — Submarine can torpedo the destroyer if not found first

---

## Technical Scope (MVP Only)

### What To Build

| System | MVP Scope |
|--------|-----------|
| **Map** | 2D tactical display. Single 200×200nm area. |
| **Assets** | One platform type (MPA). Position, heading, speed, fuel. |
| **Sensors** | 4 types (passive sonobuoy, active sonobuoy, radar, MAD). |
| **Tracks** | Datum (position + timestamp), AOU (expanding circle), bearing lines, track quality (tentative/firm/lost), identification (unknown/classified/identified). |
| **Tasking** | 4 mission types. Area selection, route drawing. |
| **Target AI** | Follow patrol route. Signature changes with state. Max speed defines AOU expansion rate. |
| **Time** | Pause + 3 speeds. Game clock. AOU expansion tied to game time. |
| **UI** | Tactical display. Asset panel. Track list with AOU status. Mission controls. Bearing line rendering. |

### What NOT To Build (Yet)

- 3D globe
- Multiple asset types
- Combat/weapons
- Economy/resources
- Tech tree
- Weather
- Terrain effects
- Multiplayer
- Save/load
- Sound (nice to have but not required)

---

## Development Phases

### Phase 1: Core Loop (2-3 weeks)
- 2D map with pan/zoom
- MPA entity with movement
- Basic tasking (click to move)
- Time system
- Placeholder UI

**Milestone:** Aircraft flies around a map.

### Phase 2: Sensors (2-3 weeks)
- Sonobuoy deployment
- Detection range checks
- Contact creation
- Confidence system (5 states)
- Contact display

**Milestone:** MPA can detect a stationary target.

### Phase 3: Target (1-2 weeks)
- Submarine entity with patrol route
- Signature states (silent/transit/snorkel)
- Detection probability based on signature
- Confidence decay when not covered

**Milestone:** MPA can find a moving submarine.

### Phase 4: Complete Mission (1-2 weeks)
- Win/lose conditions
- Mission briefing
- Results screen
- Tutorial tooltips
- Polish and balance

**Milestone:** Complete, playable Mission 1.

**Total: 6-10 weeks to playable MVP**

---

## Success Criteria

Mission 1 succeeds if:

1. **Playtesters complete it** — >80% finish without giving up
2. **The hunt is engaging** — Players say "where IS that submarine?"
3. **Confidence makes sense** — Players understand why it's at 45% vs 80%
4. **Sonobuoy tactics emerge** — Players develop strategies for buoy placement
5. **"One more try" urge** — Players want to replay and find it faster
6. **Learning happens** — Players can explain how passive vs active sonobuoys differ

---

## Expansion Path

```
Mission 1: Find submarine (sensor puzzle)
    ↓
Mission 2: Find and kill submarine (full kill chain, destroyer)
    ↓
Mission 3: Multiple contacts (track management)
    ↓
Mission 4: Submarine fights back (emission economy, evasion)
    ↓
Mission 5+: More assets, more complexity, campaign structure
    ↓
Eventually: 3D globe, multiple theaters, theater-scale operations
```

Each mission adds ONE new concept. Players learn by playing.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-05 | 2.0 | Major simplification based on PA:T design philosophy. Staged reveal. 2D first. Single aircraft MVP. |
| 2026-02-05 | 1.0 | Initial MVP design with destroyer scenario. |
