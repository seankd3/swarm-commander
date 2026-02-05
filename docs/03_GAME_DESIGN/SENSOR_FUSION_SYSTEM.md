# Sensor Fusion System — Core Game Mechanic Specification

> **This is the most important system in NEXUS.** Sensor fusion is not a feature — it IS the game.
> This document is written as an implementation spec. Formulas are exact. Edge cases are defined.

---

## Design Intent

The player's primary activity is **building and maintaining a sensor picture** of the operational environment. Everything else — combat, logistics, economy — flows from sensor coverage. If you can't see the enemy, you can't kill them. If they can see you, they can kill you.

The core tension: **emitting to see means being seen.** Every sensor decision is a tradeoff between information gained and risk accepted.

---

## Area of Uncertainty (AOU) Model

### Core Concept

Detection in NEXUS is spatial, not abstract. When you detect something, you know where it **was**, not where it **is**. The target keeps moving. Your uncertainty about its current position grows over time.

This is represented by the **Area of Uncertainty (AOU)** — a circle (or ellipse) on the map showing where the target could be right now.

### Datum

The **datum** is the last known position — where a sensor detected the target, and when.

- Example: "Detected at position 34.5N 127.2E at 14:23:15"
- This is fact — the target was here at this time
- Each new sensor contact creates a new datum, resetting the clock

### AOU Expansion

The AOU grows based on how far the target could have moved since the datum:

```
aou_radius = sensor_base_error + (time_since_datum × target_max_speed)
```

Where:
- `sensor_base_error` — initial position uncertainty from the sensor type (see table below)
- `time_since_datum` — seconds since the datum was established
- `target_max_speed` — maximum speed of the target type (meters/second)

**Example:** Submarine max speed = 8 knots (4.1 m/s). Passive sonobuoy bearing intersection gives ±500m error. Last detection 15 minutes ago.
- `aou_radius = 500 + (900 × 4.1) = 4190m ≈ 2.3nm`

### AOU Shrinking

New sensor data creates a new datum, resetting the AOU:

- Fresh detection → AOU shrinks to that sensor's base error
- Multiple sensors → AOU is the intersection of their individual constraints
- MAD pass → Very small AOU (flew directly over target, ±100m)

### Track Quality (Derived from AOU)

Track quality is a direct function of AOU size — no abstract confidence floats:

| State | AOU Radius | Meaning | Display |
|-------|-----------|---------|---------|
| **Firm** | < 1nm | Good position fix, recent datum | Solid AOU circle, heading arrow |
| **Tentative** | 1nm - 10nm | Initial detection or aging track | Dashed AOU circle, "?" icon |
| **Lost** | > 10nm | Target could be anywhere | Faded circle, no updates |

Track quality transitions happen automatically as AOU expands or new data arrives.

### Identity (Separate Axis)

Identity is about **what** the target is, separate from **where** it is:

| State | Meaning | How Achieved | Display |
|-------|---------|-------------|---------|
| **Unknown** | Something detected | Any sensor contact | Generic contact icon |
| **Classified** | Domain known (sub vs surface) | Sensor type implies domain (sonar → subsurface) | Domain-specific icon |
| **Identified** | Type known (Kilo-class, hostile) | Close sensor pass OR multi-sensor confirmation | Full icon with classification |

**Key insight:** You can have a Firm track on an Unknown contact (know WHERE, not WHAT). You can have an Identified but Lost track (know WHAT, lost WHERE).

Identity is earned through sustained sensor contact or specific sensor types:
- Acoustic signature analysis → classifies hull type (requires ~30 seconds sustained contact)
- MAD confirmation → confirms submarine (binary: submarine or not)
- Visual/EO/IR at close range → full identification
- Multiple sensor types confirming same classification → identification bonus

---

## Detection Pipeline

### Step 1: Sensor Range Check

Can this sensor detect this target at this range in these conditions?

```
effective_range = (sensor_power × target_signature) / environment_factor
detected = (distance_to_target < effective_range)
```

Where:
- `sensor_power` — intrinsic sensor capability (see sensor table)
- `target_signature` — target's cross-section for this sensor type (higher = easier to detect)
- `environment_factor` — weather/terrain modifier (1.0 = clear, higher = worse)

### Step 2: Detection Event Creates Datum

When a sensor detects a target, it produces spatial data:

| Sensor Type | Output | Base Error |
|-------------|--------|------------|
| Passive sonobuoy | Bearing only (no range) | ±3° bearing accuracy |
| Active sonobuoy | Range + bearing | ±200m position fix |
| Surface radar | Range + bearing | ±500m position fix |
| MAD | Fly-over confirmation | ±100m position fix |

**Passive sensors (bearing only):** A single bearing line extends infinitely from the sensor — the target is somewhere along that line. No datum position is created from a single bearing. Two or more bearing lines from different sensors create an intersection — that intersection IS the datum.

### Step 3: Bearing Intersection (Passive Sensors)

Two bearing lines from different positions produce a position fix:

```
intersection_error = bearing_accuracy / sin(angle_between_bearings)
```

Where:
- `bearing_accuracy` — sensor's angular accuracy in meters at the target's range
- `angle_between_bearings` — angle between the two bearing lines

**Best case (90 intersection):** error ≈ 500m → good datum
**Worst case (shallow angle < 15):** error ≈ 5000m → poor datum
**Parallel bearings:** No intersection → display "No Fix" warning to player

**Implementation rule:** If `angle_between_bearings < 10`, reject the fix and warn the player. They need to reposition sonobuoys.

### Step 4: AOU Expansion (Every Tick)

Between detection events, AOU grows at `target_max_speed`:
```
aou_radius += target_max_speed × delta_time
```

This runs every simulation tick. The circle visibly grows on the player's display.

### Step 5: Track Promotion / Demotion

After each tick, re-evaluate track quality:
```
if aou_radius < FIRM_THRESHOLD (1nm = 1852m):
    quality = FIRM
elif aou_radius < LOST_THRESHOLD (10nm = 18520m):
    quality = TENTATIVE
else:
    quality = LOST
```

---

## Sensor Type Specifications

### MVP Sensors (Mission 1)

| Sensor | Type | Range | Output | Base Error | Notes |
|--------|------|-------|--------|------------|-------|
| **Passive Sonobuoy** | Passive | 15nm | Bearing only | ±3° | Drop in water. Listens. No emission. |
| **Active Sonobuoy** | Active | 8nm | Range + bearing | ±200m | Pings. Target hears it. |
| **Surface Radar** | Active | 80nm | Range + bearing | ±500m | Detects periscope/snorkel. Target's RWR detects you. |
| **MAD** | Passive | 500m | Fly-over confirm | ±100m | Must fly directly over. Confirms submarine. |

### Full Sensor Roster (Post-MVP)

| Sensor Type | Range | Power | Passive? | Emission | Best For |
|-------------|-------|-------|----------|----------|----------|
| Radar (fighter AESA) | 150 km | 200 | No | 0.8 | Air targets, all-weather |
| Radar (naval AESA) | 350 km | 500 | No | 1.0 | Air/missile defense |
| Radar (AWACS) | 450 km | 600 | No | 0.9 | Wide-area air surveillance |
| Radar (SAR) | 100 km | 150 | No | 0.6 | Ground targets through clouds |
| EO/IR (targeting pod) | 60 km | 100 | Yes | 0.0 | Visual identification |
| IRST | 120 km | 80 | Yes | 0.0 | Passive air tracking |
| ELINT (dedicated) | 400 km | 300 | Yes | 0.0 | Detecting emitters |
| RWR (all platforms) | 2x emitter range | N/A | Yes | 0.0 | Threat warning |
| Passive Sonar (towed) | 100 km | 150 | Yes | 0.0 | Submarine detection |
| Active Sonar | 30 km | 250 | No | 0.9 | Submarine localization |
| Sonobuoy (passive) | 15 km | 50 | Yes | 0.0 | Expendable sub detection |
| Sonobuoy (active) | 8 km | 100 | No | 0.7 | Sub pinging |
| Satellite (EO) | Orbital | 80 | Yes | 0.0 | Strategic surveillance |
| Satellite (SAR) | Orbital | 120 | No | 0.2 | All-weather ground mapping |
| OTH Radar | 3000 km | 50 | No | 1.0 | Strategic early warning |
| Acoustic (ground) | 3 km | 30 | Yes | 0.0 | Ground vehicle detection |
| Seismic | 1 km | 20 | Yes | 0.0 | Heavy vehicle/artillery |

### Sensor Properties (Data Schema)

```
Sensor {
    type: SensorType           // Enum: PASSIVE_SONOBUOY, ACTIVE_SONOBUOY, RADAR, MAD, etc.
    maxRange: number           // Maximum detection range (meters)
    power: number              // Detection capability scalar
    fieldOfView: number        // Azimuth coverage (degrees, 360 = omnidirectional)
    isActive: boolean          // Currently emitting?
    emissionSignature: number  // How detectable when active (0.0-1.0)
    baseError: number          // Position accuracy (meters) or bearing accuracy (degrees)
    outputType: 'position' | 'bearing'  // What detection data this sensor produces
    updateInterval: number     // Seconds between scan updates
}
```

---

## The Emission Economy

### The 2x Rule (Core Mechanic)

**Any active sensor can be detected by passive sensors at approximately 2x its own detection range.**

```
elint_detection_range = emitter_range × 2.0
```

This means:
- Fighter radar (150 km range) → detectable at 300 km by ELINT
- Naval radar (350 km) → detectable at 700 km
- Active sonar (30 km) → detectable at 60 km underwater
- Active sonobuoy (8nm) → audible at 16nm to submarine

**This is the foundation of every sensor decision.** Emit to see, but know you're being seen at double the range.

### EMCON (Emission Control) Profiles

Each unit/swarm has an EMCON setting:

| EMCON Level | Behavior | Tradeoff |
|-------------|----------|----------|
| **STRICT** | All active sensors OFF. Passive only. | Max stealth. Severely degraded awareness. |
| **LIMITED** | Defensive sensors only. No search emissions. | Low signature. Relies on network data. |
| **NORMAL** | Search radar intermittent. Active sonar on demand. | Moderate signature. Good awareness. |
| **AGGRESSIVE** | All sensors active continuously. | Max awareness. Max signature. Brightest target in theater. |

EMCON switching takes 15 seconds (sensor warmup).

### Anti-Radiation Weapons (Post-MVP)

ARMs home on active emitters:
```
arm_lock_range = emitter_detection_range × 0.8
```

Keep your radar on → eat a HARM. The counter: emit intermittently, use decoys, or shut down and relocate.

---

## Sensor Fusion — How Layers Combine

### Track Correlation

When two sensors detect the same target, the system merges them into one track:

```
correlation_check:
    if position_overlap AND velocity_similar AND time_recent:
        merge into single track
        combined_aou = intersection of individual AOUs
```

The intersection of two AOUs is always smaller than either alone. This is the mechanical incentive to use multiple sensors on the same target.

### Multi-Sensor Identification Bonus

Different sensor types contribute to identification at different rates:

| Sensor | Classification Speed | Identification Speed |
|--------|---------------------|---------------------|
| Radar | Medium (RCS estimate) | Slow (needs other sensors) |
| EO/IR | Fast (visual shape) | Very Fast (visual ID) |
| ELINT | Very Fast (emission = type) | Fast (specific emitter = platform) |
| Acoustic | Fast (signature databases) | Fast (propeller cavitation = hull) |
| MAD | N/A (confirms submarine) | N/A (domain only) |

### Fusion Bonus

When multiple sensor **types** (not multiples of the same type) contribute to a track:

```
identification_time_multiplier = 1.0 / (1.0 + (unique_sensor_types - 1) × 0.3)
```

- 1 sensor type: 1.0x (baseline identification time)
- 2 sensor types: 0.77x (30% faster)
- 3 sensor types: 0.62x (38% faster)
- 4+ sensor types: 0.53x (cap)

**This rewards sensor diversity.** Stacking 5 sonobuoys gives 5 bearing lines. Adding 1 MAD pass on top gives a fusion bonus AND confirms submarine classification instantly.

---

## Network & Datalink

### Shared Picture

All friendly sensor data feeds into a Common Operating Picture (COP):

```
NetworkLink {
    bandwidth: number       // Data throughput
    latency: number         // Seconds of delay
    quality: number         // 0.0-1.0, packet delivery reliability
}
```

**Degradation effects:**
- `quality < 0.5` → shared tracks update at half rate
- `quality < 0.2` → unit is effectively offline (own sensors only)
- `latency > 5s` → shared track positions have additional AOU expansion from stale data
- Relay chain > 3 hops → 10% chance per tick of missed updates

### Network as Target (Post-MVP)

Destroying or jamming network nodes degrades the entire force's picture:
- Destroy AWACS → all units lose its radar contribution
- Jam datalinks → units see with own sensors but can't share
- Destroy satellite relay → units in that zone lose over-horizon comms

---

## Signature System

Each platform has signatures per sensor type:

```
SignatureProfile {
    acoustic: number        // 0.1 (silent running) to 3.0 (surface ship)
    radar: number           // 0.001 (stealth) to 10000 (carrier)
    infrared: number        // 0.1 (electric) to 5.0 (afterburner)
    visual: number          // 0.1 (small drone) to 5.0 (carrier)
    electromagnetic: number // 0.0 (EMCON strict) to 2.0 (radiating)
}
```

Signatures change based on state:
- Submarine snorkeling: acoustic × 3, radar cross-section increases
- Submarine silent running: acoustic × 0.3
- Aircraft afterburner: infrared × 3
- Any platform radar active: electromagnetic = emission level

---

## Edge Cases

### Parallel Bearing Lines
If two passive sonobuoy bearings are nearly parallel (< 10 angle), no position fix is possible. Display "Insufficient Angle — Reposition Sensors" warning.

### AOU Exceeds Play Area
When `aou_radius > play_area_diameter`, track is automatically set to Lost. The target could be anywhere.

### Submarine Exits Play Area
If the submarine crosses the boundary while tracked, the track persists but AOU continues expanding. If the submarine crosses while Lost, it's gone — mission failure path.

### All Sonobuoys Expended
Player must rely on MPA's radar and MAD. Radar requires snorkel/periscope (intermittent). MAD requires fly-over (need approximate position). This is a recoverable but difficult state.

### Target Stationary
AOU still expands (player doesn't know the target stopped), but at the target's max speed. The target's actual position remains within the AOU circle.

---

## MVP Implementation Path

### Milestone 1: Basic Detection
- Passive sonobuoys: deploy, detect, produce bearing lines
- Bearing intersection: two bearings → datum + AOU
- AOU expansion over time
- Track quality: Tentative / Firm / Lost

### Milestone 2: Full Sensor Suite
- Active sonobuoys: ping → position fix
- Surface radar: detects snorkel/periscope
- MAD: fly-over confirmation
- Submarine signature states

### Milestone 3: Complete Mission
- Identity states: Unknown → Classified → Identified
- Win/lose conditions based on track quality + identity
- Full sensor tradeoffs (passive vs active)

### Milestone 4: Emission Economy (Post-validation)
- 2x rule implementation
- EMCON profiles
- Submarine reacts to active sensors
- RWR system

### Milestone 5+: Full Fusion
- Track correlation across sensor types
- Fusion bonus for multi-sensor coverage
- Network/datalink with latency
- Weather/terrain effects on sensors
- All sensor types from full roster
