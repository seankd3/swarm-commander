# Sensor Fusion System — Core Game Mechanic Specification

> **This is the most important system in NEXUS.** Sensor fusion is not a feature — it IS the game.
> This document is written as an implementation spec. Formulas are exact. Edge cases are defined.

---

## Design Intent

The player's primary activity is **building and maintaining a sensor picture** of the operational environment. Everything else — combat, logistics, economy — flows from sensor coverage. If you can't see the enemy, you can't kill them. If they can see you, they can kill you.

The core tension: **emitting to see means being seen.** Every sensor decision is a tradeoff between information gained and risk accepted.

---

## Detection Confidence Model

### The Five States

Every contact exists in one of five confidence states. Confidence is a float value (0.0 to 1.0) that maps to discrete states:

| State | Confidence Range | Player Display | Engageable? |
|-------|-----------------|----------------|-------------|
| **Undetected** | 0.00 | Nothing visible | No |
| **Anomaly** | 0.01 - 0.25 | Faint blip, dashed circle, "?" icon | No |
| **Contact** | 0.26 - 0.50 | Solid blip, uncertainty ellipse, domain icon (air/ground/sea) | Only at Aggression > 0.8 |
| **Track** | 0.51 - 0.75 | Typed icon, heading arrow, speed estimate, "UNK" tag | At Aggression > 0.5 |
| **Identified** | 0.76 - 1.00 | Full icon, type name, allegiance (hostile/neutral/friendly), capability summary | Standard ROE |

### Confidence Accumulation Formula

Each sensor contributes confidence to a contact over time:

```
confidence_delta = (sensor_power / (distance² × target_signature × environment_factor)) × delta_time
```

Where:
- `sensor_power` — intrinsic sensor capability (defined per sensor type, see table below)
- `distance` — range from sensor to target (meters)
- `target_signature` — target's cross-section for this sensor type (lower = stealthier, see Signature System)
- `environment_factor` — weather/terrain modifier (1.0 = clear, higher = worse conditions)
- `delta_time` — seconds since last update

**Multiple sensors stack additively.** If Sensor A contributes +0.05/sec and Sensor B contributes +0.03/sec, total accumulation is +0.08/sec.

**Confidence decays** when no sensor has LOS/detection:
```
confidence -= decay_rate × delta_time
```
- `decay_rate` = 0.05/sec for baseline (contact loses all confidence in 20 seconds without coverage)
- Reduced by **tracking quality**: if a track was Identified (>0.75), decay rate halves (memory of a confirmed contact persists longer)
- **Stationary targets** decay at 0.5× rate (they're probably still there)
- **Fast movers** decay at 2.0× rate (high uncertainty about current position)

### Position Uncertainty

In addition to confidence, each contact has a **position uncertainty radius** that represents how precisely we know where the target is:

```
uncertainty_radius = base_uncertainty × (1 + time_since_last_update × target_max_speed / 1000)
```

Where:
- `base_uncertainty` — set by best sensor currently tracking (radar: 50m, EO/IR: 10m, ELINT: 2000m single/200m triangulated, acoustic: 500m)
- `time_since_last_update` — seconds since last sensor return
- `target_max_speed` — estimated maximum speed of target type (km/h)

Display: uncertainty renders as an ellipse around the contact icon. Size scales with uncertainty. At targeting quality (<100m), ellipse is invisible at most zoom levels.

---

## Sensor Type Specifications (Game Values)

### Overview Matrix

| Sensor Type | Game Range | Sensor Power | Passive? | Emission Signature | Best For |
|-------------|-----------|-------------|----------|-------------------|----------|
| Radar (fighter AESA) | 150 km | 200 | NO | 0.8 (high) | Air targets, all-weather |
| Radar (naval AESA) | 350 km | 500 | NO | 1.0 (very high) | Air/missile defense |
| Radar (AWACS) | 450 km | 600 | NO | 0.9 (very high) | Wide-area air surveillance |
| Radar (SAR ground mapping) | 100 km | 150 | NO | 0.6 (medium) | Ground targets through clouds |
| EO/IR (targeting pod) | 60 km | 100 | YES | 0.0 (none) | Visual identification |
| IRST | 120 km | 80 | YES | 0.0 (none) | Passive air tracking |
| ELINT (dedicated) | 400 km | 300 | YES | 0.0 (none) | Detecting emitters |
| RWR (all platforms) | 2× emitter range | N/A | YES | 0.0 (none) | Threat warning |
| Passive Sonar (towed) | 100 km | 150 | YES | 0.0 (none) | Submarine detection |
| Active Sonar | 30 km | 250 | NO | 0.9 (very high underwater) | Submarine localization |
| Sonobuoy (passive) | 15 km | 50 | YES | 0.0 (none) | Expendable sub detection |
| Sonobuoy (active) | 8 km | 100 | NO | 0.7 (high underwater) | Sub pinging |
| Satellite (EO) | Orbital | 80 | YES | 0.0 (none) | Strategic surveillance |
| Satellite (SAR) | Orbital | 120 | NO | 0.2 (low — space) | All-weather ground mapping |
| OTH Radar | 3000 km | 50 | NO | 1.0 (enormous) | Strategic early warning |
| Acoustic (ground) | 3 km | 30 | YES | 0.0 (none) | Ground vehicle detection |
| Seismic | 1 km | 20 | YES | 0.0 (none) | Heavy vehicle/artillery |

### Sensor Properties Detail

Each sensor instance has these properties:

```
SensorComponent {
    sensor_type: SensorType,        // Enum (Radar, EOIR, ELINT, etc.)
    max_range: f32,                 // Maximum detection range (meters)
    sensor_power: f32,              // Detection capability scalar
    field_of_view: f32,             // Azimuth coverage (degrees, 360 = omnidirectional)
    elevation_coverage: (f32, f32), // Min/max elevation angles
    update_interval: f32,           // Seconds between scan updates
    is_active: bool,                // Currently emitting? (for active sensors)
    emission_signature: f32,        // How detectable is this sensor when active (0.0-1.0)
    modes: Vec<SensorMode>,         // Available operating modes
    current_mode: SensorMode,       // Currently selected mode
    classification_bonus: f32,      // How fast this sensor progresses confidence (multiplier)
}
```

---

## The Emission Economy

### The 2x Rule (Core Mechanic)

**Any active sensor (radar, active sonar, jammer) can be detected by passive sensors at approximately 2× its own detection range.**

Implementation:
```
elint_detection_range = emitter_range × 2.0 × (emitter_power / baseline_power)
```

Where `baseline_power` is calibrated so that a standard fighter radar (150 km range) is detectable by ELINT at ~300 km.

This means:
- Fighter radar (150 km) → detectable at 300 km
- Naval radar (350 km) → detectable at 700 km
- AWACS (450 km) → detectable at 900 km
- OTH radar (3000 km) → detectable globally (it's a fixed installation, everyone knows where it is)
- Active sonar (30 km) → detectable at 60 km (underwater acoustic propagation)

### EMCON (Emission Control) Profiles

Each swarm has an EMCON setting that controls emission behavior:

| EMCON Level | Behavior | Tradeoff |
|-------------|----------|----------|
| **STRICT** | All active sensors OFF. Passive only. No radar, no active sonar, no IFF interrogation. Radio comms minimized. | Minimum signature. Maximum stealth. Severely degraded awareness — only passive sensors (ELINT, IRST, passive sonar, acoustic). |
| **LIMITED** | Defensive sensors only. RWR active, IFF interrogation on incoming contacts only. No search radar. | Low signature. Good threat warning. Cannot detect new contacts with own sensors — relies on network data. |
| **NORMAL** | Search radar active on schedule (intermittent sweeps). Active sonar on demand. Standard comms. | Moderate signature. Good situational awareness. Detectable by ELINT when emitting. |
| **AGGRESSIVE** | All sensors active continuously. Maximum emission power. Continuous radar sweeps. | Maximum awareness. Maximum signature. The brightest target on every ELINT receiver within 2× range. |

Player sets EMCON per swarm. Can be changed at any time. Switching from STRICT to AGGRESSIVE takes 15 seconds (sensor warmup time).

### Anti-Radiation Weapons (ARM)

Platforms equipped with ARMs can target active emitters:

```
arm_lock_range = emitter_detection_range × 0.8  // Can lock from slightly less than ELINT range
arm_accuracy = proportional to emitter duty cycle (continuous emission = high accuracy)
```

ARMs create the hard counter to aggressive emission: keep your radar on and a HARM-equivalent will find you. The defense: emit intermittently (reduces ARM lock quality), use decoy emitters, or shut down and relocate.

---

## Sensor Fusion — How Layers Combine

### Track Correlation

When two or more sensors detect the same physical target, the system must recognize them as one contact, not two. Track correlation logic:

```
correlation_score = f(position_overlap, velocity_similarity, time_proximity, classification_match)

if correlation_score > CORRELATION_THRESHOLD (0.7):
    merge into single track
    combined_confidence = max(conf_A, conf_B) + min(conf_A, conf_B) × 0.5
    combined_uncertainty = min(uncertainty_A, uncertainty_B) × 0.7
```

This means: the best sensor sets the floor, and the second sensor provides a bonus. Two mediocre sensors together are better than one.

### Sensor Type Bonuses for Classification

Different sensors are better at different classification tasks:

| Sensor | Detection Speed | Classification Speed | Identification Speed |
|--------|----------------|---------------------|---------------------|
| Radar | Fast (range + velocity quickly) | Medium (RCS estimate, Doppler signature) | Slow (needs other sensors) |
| EO/IR | Slow (short range) | Fast (visual shape recognition) | Very Fast (can visually ID) |
| ELINT | Fast (if target emitting) | Very Fast (emission signature = type) | Fast (specific emitter = specific platform) |
| IRST | Medium | Slow (heat blob, limited detail) | Slow (needs close range) |
| Acoustic | Medium (submarine context) | Fast (acoustic signature databases) | Fast (propeller cavitation = hull type) |

### The Fusion Bonus

When multiple sensor TYPES (not just multiple sensors of the same type) contribute to a track, a fusion bonus applies:

```
fusion_multiplier = 1.0 + (unique_sensor_types_contributing - 1) × 0.3
```

So:
- 1 sensor type: 1.0× confidence accumulation
- 2 sensor types: 1.3× (e.g., radar + ELINT)
- 3 sensor types: 1.6× (e.g., radar + ELINT + EO/IR)
- 4+ sensor types: 1.9× (diminishing returns cap at 2.0×)

**This is the mechanical incentive to layer different sensor types.** Stacking 5 radars on the same area gives 5× detection power but only 1.0× fusion bonus. Using 1 radar + 1 ELINT + 1 EO/IR + 1 acoustic gives less raw power but 1.9× fusion bonus, AND each sensor covers the others' weaknesses.

---

## Network & Datalink

### Shared Picture

All friendly sensor data feeds into a Common Operating Picture (COP) — but with latency and degradation based on network quality:

```
NetworkComponent {
    bandwidth: f32,          // Data throughput (affects track update rate shared to network)
    latency: f32,            // Seconds of delay for shared data
    link_quality: f32,       // 0.0-1.0, affects whether data gets through
    relay_chain_length: u8,  // How many hops to reach C2. More hops = more latency + degradation
}
```

**Network degradation effects:**
- `link_quality < 0.5` → shared tracks update at half rate
- `link_quality < 0.2` → unit is effectively offline (uses only own sensors)
- `latency > 5 seconds` → shared track positions have additional uncertainty from stale data
- Relay chain > 3 hops → 10% chance per tick of packet loss (missed updates)

### Network as Target

Destroying or jamming network nodes degrades the entire force's sensor picture:
- Destroy AWACS → all units lose its radar contribution to fusion
- Jam datalinks → units can still see with own sensors but can't share
- Destroy satellite relay → units in that coverage zone lose over-horizon communication

**This creates the counter-NCW gameplay:** instead of fighting the enemy's weapons, fight their network. Blind them. Isolate them. Make their swarms deaf and dumb.

---

## Signature System (Target Properties)

Each platform has signatures for each sensor type:

```
SignatureComponent {
    radar_cross_section: f32,    // 0.001 (stealth) to 10000 (carrier). Affects radar detection range.
    infrared_signature: f32,     // 0.1 (electric, cold) to 5.0 (afterburner). Affects IR detection.
    acoustic_signature: f32,     // 0.1 (silent running sub) to 3.0 (surface ship). Affects sonar.
    visual_signature: f32,       // 0.1 (small drone) to 5.0 (carrier). Affects EO detection.
    electromagnetic_signature: f32, // 0.0 (EMCON strict) to 2.0 (Aegis radiating). ELINT detection.
}
```

Signatures are **not fixed** — they change based on platform state:
- Aircraft in afterburner: IR signature × 3
- Ship at flank speed: acoustic signature × 2
- Any platform with radar active: EM signature = radar emission level
- Submarine at periscope depth: radar cross section increases dramatically
- Ground vehicle engine off: IR and acoustic signatures drop to 0.2× baseline

---

## Satellite Mechanics

Satellites are unique because they're **periodic, not persistent:**

```
SatelliteComponent {
    orbit_altitude: f32,         // km (LEO: 200-2000, MEO: 2000-35786, GEO: 35786)
    orbital_period: f32,         // seconds (LEO ~90 min, GEO = stationary)
    swath_width: f32,            // km (imaging width per pass)
    revisit_interval: f32,       // seconds between passes over same point
    sensor_type: SensorType,     // EO, SAR, IR, SIGINT
    tasking_delay: f32,          // seconds from command to execution (retask time)
    downlink_delay: f32,         // seconds from image capture to data availability
}
```

**Gameplay implications:**
- LEO imaging satellites pass over a point **~2 times per day** with a 15-20 km imaging swath
- Player must predict where targets will be and task satellite passes in advance
- GEO satellites provide continuous coverage of one hemisphere but at lower resolution
- Satellite passes create **windows of opportunity** — the enemy knows when your satellite is overhead and can hide or emit differently
- Satellites can be destroyed (ASAT weapons) or dazzled (laser weapons)

**This creates a planning layer:** satellite tasking is a strategic decision made minutes to hours in advance, unlike tactical sensors that respond in real-time.

---

## MVP Implementation Path

### Phase 1: Basic Detection (Weeks 1-4)
- Binary detection within range (not probabilistic)
- Single sensor type: radar with fixed range
- Simple fog of war: visible or not
- **Goal:** Units appear/disappear based on radar coverage circles

### Phase 2: Confidence Model (Weeks 5-8)
- Probabilistic detection with 5 confidence states
- Confidence accumulation and decay
- Two sensor types: radar (active) + EO/IR (passive)
- Position uncertainty ellipses
- **Goal:** Contacts build from anomaly to identified over time

### Phase 3: Emission Economy (Weeks 9-12)
- ELINT detection of active emitters (the 2x rule)
- EMCON profiles per swarm
- RWR on all units
- Three+ sensor types: radar, EO/IR, ELINT
- **Goal:** The core "emit to see = be seen" loop is functional

### Phase 4: Full Fusion (Weeks 13-16)
- Track correlation across sensor types
- Fusion bonus for multi-sensor coverage
- Network/datalink with latency and degradation
- All sensor types implemented
- Weather/terrain effects on sensors
- **Goal:** Complete sensor fusion system as described in this spec

### Phase 5: Iteration & Balance (Ongoing)
- Satellite mechanics
- Anti-radiation weapons
- Advanced EW (deception jamming, GPS spoofing)
- Balance passes based on playtesting
