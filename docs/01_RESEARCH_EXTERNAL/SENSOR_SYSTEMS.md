# Real-World Sensor Systems Reference

> This document provides real-world sensor specifications that ground NEXUS's game mechanics in reality.
> Game values are abstracted from these specs, not copied directly — gameplay comes first.

---

## Sensor Categories Overview

Modern military sensors fall into six categories. Each detects different physical phenomena, has different strengths/weaknesses, and critically: **different emission signatures**.

| Category | Detects | Range Class | Passive? | Key Limitation |
|----------|---------|-------------|----------|----------------|
| Radar (RF) | Reflected radio waves | Long (50-500+ km) | NO — active emitter | Reveals own position. Jammable. |
| EO/IR (Electro-Optical/Infrared) | Light and heat | Medium (5-80+ km) | YES — fully passive | Weather-dependent. Horizon-limited. |
| SIGINT/ELINT | Electromagnetic emissions | Very Long (50-500+ km) | YES — fully passive | Target must be emitting. Bearing-only (single sensor). |
| Acoustic | Sound waves | Short-Medium (3-150 km) | PASSIVE or ACTIVE | Environmental interference. Slow propagation. |
| Space-Based (SAR/EO) | Various from orbit | Global | Mostly passive | Revisit gaps. Resolution limits. ASAT vulnerability. |
| Cyber/Network | Data signatures | Network-dependent | YES | Requires network access. |

---

## Radar Systems — Detailed Specifications

### Fighter/Drone AESA Radar
Real-world references: AN/APG-77 (F-22), AN/APG-81 (F-35), AN/APG-83 SABR (F-16V)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range (1m² RCS) | 150-220+ km | Primary air-to-air sensor. Medium range. |
| Detection range (0.01m² RCS — stealth) | 30-50 km | Stealth dramatically reduces detection range |
| Track capacity | 20-30 simultaneous | Limits engagement capacity |
| Scan volume | 120° azimuth, ±60° elevation | Not omnidirectional — must point the right way |
| Modes | Search, TWS, STT, SAR, GMTI | Different modes for different jobs |
| Emission signature | High when active | Detectable by ELINT at ~2x detection range |
| Size/weight | Fits on fighter nose | Carried by medium+ aerial platforms |

**Key modes for gameplay:**
- **TWS (Track While Scan):** Maintains tracks on multiple targets while continuing to search. Target RWR shows "search" — doesn't know it's being tracked. Lower guidance accuracy.
- **STT (Single Target Track):** Locks one target with full power. Excellent guidance. Target RWR shows "LOCK" — knows it's targeted. Target can deploy countermeasures.
- **SAR (Synthetic Aperture Radar):** Maps ground terrain at high resolution. Used for finding ground targets through cloud/darkness. Requires stable flight path.
- **GMTI (Ground Moving Target Indicator):** Detects moving vehicles on ground. Cannot see stationary targets. Speed threshold: ~5 km/h.

### Naval AESA Radar
Real-world references: AN/SPY-1 (Aegis), AN/SPY-6 (AMDR), Type 346 (Chinese)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range (aircraft) | 200-400+ km | Longest-range tactical radar |
| Detection range (missile) | 150-300 km | Ballistic missile defense capable |
| Track capacity | 100-1000+ simultaneous | Can manage entire battlespace |
| Coverage | 360° continuous (4 fixed arrays) | Omnidirectional — no blind spots |
| Automation | Near-autonomous detect/track/engage | Aegis can engage without human decision |
| Emission signature | Very high (high power) | Major ELINT beacon — detected at 500+ km |
| Size/weight | Ship-mounted only | Only on large surface combatants |

**Game mechanic note:** Naval radar is the most capable but also the most detectable. A destroyer running Aegis is the brightest thing on the ELINT spectrum for hundreds of kilometers.

### Over-the-Horizon Radar (OTH-R)
Real-world references: JORN (Australia), AN/TPS-71 ROTHR (US), Sunflower (Russia)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | 1,000-4,000 km (reported to 5,500 km) | Strategic early warning only |
| Resolution | Very low (km-scale) | Detects "something big exists" — no ID |
| Coverage | Wide azimuth sectors (60-180°) | Fixed installation, covers specific sectors |
| Mechanism | Ionospheric refraction (skywave) | Affected by space weather, aurora, solar activity |
| Update rate | Minutes (slow scan) | Not useful for tactical engagement |
| Emission signature | Enormous | Fixed, known location — priority SEAD target |

**Game mechanic note:** OTH radar is your strategic early warning. It tells you a fleet left port 2,000 km away, but it can't tell you how many ships or what type. You need other sensors to classify.

### Ground-Based Air Defense Radar
Real-world references: S-400 (91N6E / 96L6), Patriot AN/MPQ-65, NASAMS

| Parameter | S-400 System | Game Relevance |
|-----------|-------------|----------------|
| Surveillance range | 600 km (91N6E Big Bird) | Massive coverage bubble |
| Engagement range | 400 km (40N6 missile) | Longest-range SAM system |
| Track capacity | 300 targets, engage 72 | Overwhelmable by saturation |
| Altitude coverage | 5m to 30 km | Near-zero minimum altitude = hard to underfly |
| Mobility | Deploy in 5 min, relocate in hours | Shoot-and-scoot capability |
| Kill probability | 0.9 claimed per missile | 2-4 missiles per target for high Pk |

---

## EO/IR Systems — Detailed Specifications

### Targeting Pods (Airborne EO/IR)
Real-world references: Sniper ATP (AN/AAQ-33), Litening, LANTIRN, MTS-B (MQ-9)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | 75+ km (vehicle-size) | Shorter than radar but provides visual ID |
| ID range | 40+ km (vehicle type classification) | This is where "Track" becomes "Identified" |
| Resolution | Can read license plates at 15 km | Extremely precise identification capability |
| Modes | TV (daytime), IR (night/all-weather), laser designator | Multi-mode for different conditions |
| Emission signature | Zero (passive) / Low (laser only when designating) | Nearly undetectable in passive mode |
| Limitations | Weather (cloud, fog, rain reduce range by 30-80%) | Primary weakness |

### IRST (Infrared Search and Track)
Real-world references: Legion Pod (F-15/F-16), OLS-35 (Su-35), PIRATE (Typhoon)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | 80+ nm (150 km) against fighter afterburner | Surprisingly long range |
| Detection range (cruise) | 40-60 nm against non-afterburning aircraft | Still useful |
| Track capacity | Multiple simultaneous | Can track several contacts passively |
| Identification | Limited — detects heat source, not detailed shape | Classifies but doesn't fully identify |
| Emission signature | Zero — fully passive | The "silent" alternative to radar |
| Limitations | Reduced by weather, atmosphere, background clutter | Less reliable than radar for consistent detection |

**Game mechanic note:** IRST is the radar-silent sensor. It detects aircraft at useful ranges without any emission. The counter: fly low (terrain masks IR signature), use reduced-signature engines, or exploit weather.

---

## SIGINT/ELINT Systems

### Dedicated SIGINT Platforms
Real-world references: RC-135 Rivet Joint, EP-3E Aries II, EA-18G Growler

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Intercept range | 240+ km (varies by emitter power) | Detects emissions at very long range |
| Identification | Can identify specific radar types by waveform | "That's an S-400 surveillance radar" |
| Geolocation | Bearing from single platform; triangulation from 2+ | Single = bearing; two platforms = position fix |
| Processing | Matches against signal libraries | Requires database — new emitters are "unknown" |
| Emission signature | Zero — fully passive | Invisible while listening |
| Crew requirement (real) | 27-30 specialists (RC-135) | In-game: high processing cost (compute cycles) |

### RWR (Radar Warning Receiver) — Every Platform Has One
Real-world: AN/ALR-56M (F-15), AN/ALR-94 (F-22), various

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | Typically 1.5-2x the radar's detection range | THIS IS THE CORE MECHANIC: RWR sees radar before radar sees you |
| Information provided | Bearing to emitter, signal type, threat classification | Tells you "radar searching at 3 o'clock" |
| Classification | Identifies radar type from signal library | Can distinguish search from lock from missile guidance |
| Emission signature | Zero — fully passive | Every unit has this baseline awareness |

**THE CRITICAL GAME DESIGN RULE:** RWR range > Radar range. This means:
- If you turn on radar and detect an enemy at 150 km, they detected YOUR radar at ~250-300 km
- They knew you were coming before you knew they were there
- This single rule creates the entire emission economy

---

## Acoustic Systems (Maritime)

### Passive Sonar (Towed Arrays)
Real-world: AN/SQR-19 TACTAS, Sonar 2087, CAPTAS-4

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | 50-150 km (optimal conditions) | Long range but highly variable |
| Classification | Identifies ship/sub type by acoustic signature | "That's a Kilo-class submarine" |
| Limitation: Thermocline | Sound refracts at temperature layers, creating shadow zones | Submarines hide below thermocline layers |
| Limitation: Speed | Tow ship must be < 12 knots or own-noise drowns signal | Forces slow, vulnerable patrol patterns |
| Emission signature | Zero | Completely passive |

### Active Sonar
Real-world: AN/SQS-53C (surface ship), sonobuoys (DICASS)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Detection range | 20-40 km (active pulse) | Shorter than passive but gives range and bearing |
| Precision | Exact range + bearing + depth | Targeting quality data immediately |
| Emission signature | VERY HIGH — heard by everyone | The underwater equivalent of turning on a spotlight |
| Counter | Submarine can detect active sonar at 2-3x the sonar's detection range | Same RWR > Radar rule applies underwater |

### Sonobuoys
Real-world: AN/SSQ-53F (DIFAR passive), AN/SSQ-62F (DICASS active)

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Passive range | 5-20 km per buoy | Create detection nets by deploying patterns |
| Active range | 3-8 km per buoy | Pinging reveals the hunt |
| Endurance | 1-8 hours | Expendable, limited lifetime |
| Deployment | Dropped from aircraft (P-8, helicopter, drone) | Maritime patrol aircraft become essential |
| Pattern | Typically 12-24 buoys in search pattern | The "sensor net" gameplay in purest form |

---

## Space-Based ISR

### Imaging Satellites (SAR/EO)
Real-world: WorldView series, Capella SAR, various classified NRO assets

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Resolution (EO) | 0.3-0.5m commercial; better classified | Can identify vehicle types from orbit |
| Resolution (SAR) | 0.5-1m commercial | Works through clouds, day and night |
| Revisit time (LEO) | 1-2 passes/day over same point; ~90 min orbital period | Coverage gaps between passes |
| Coverage per pass | Narrow swath (10-20 km wide imaging strip) | Must know WHERE to look |
| Latency | Minutes to hours for tasking + processing | Not real-time for tactical use |
| Vulnerability | ASAT missiles, dazzle lasers, cyber attack | Can be shot down |

### Missile Warning Satellites (IR)
Real-world: SBIRS (GEO + HEO), DSP

| Parameter | Real Value | Game Relevance |
|-----------|-----------|----------------|
| Coverage | Continuous global (from GEO) | Sees every large rocket/missile launch on Earth |
| Detection | Missile launch (bright IR plume) within seconds | Strategic early warning |
| Limitation | Cannot track post-boost-phase (once engine stops) | Sees launch, loses track during midcourse |
| Resolution | Adequate for launch detection, not for small targets | Not useful for tactical surveillance |

---

## Sensor Layering Doctrine — How They Work Together

### The Detection → Identification Ladder

```
STRATEGIC EARLY WARNING (OTH Radar, SBIRS, SIGINT)
   "Something is happening 2000 km away"
        ↓
WIDE-AREA SURVEILLANCE (Satellite SAR, AWACS, Maritime Patrol)
   "There's a naval group in this 200 km × 200 km area"
        ↓
NARROW-AREA SEARCH (Fighter/Drone radar, sonobuoy patterns)
   "Contact: 5 surface ships at these coordinates, heading NW at 18 kts"
        ↓
CLASSIFICATION (Multi-sensor correlation, ELINT matching)
   "3 destroyers, 1 cruiser, 1 carrier — Type 055 + Type 003 signature match"
        ↓
IDENTIFICATION (EO/IR, visual, IFF interrogation)
   "Confirmed: PLA Navy Carrier Strike Group, flagship Fujian, HOSTILE"
        ↓
TARGETING (Continuous track with targeting-quality precision)
   "Track update every 3 seconds. Weapons release authorized."
```

### Complementary Strengths Matrix

| Sensor A + Sensor B | Combined Advantage |
|---------------------|-------------------|
| ELINT + EO/IR | ELINT provides bearing to emitter at long range; EO/IR slewed to bearing for visual ID. Entirely passive chain. |
| Radar + IRST | Radar provides initial detection and range; IRST maintains track passively after radar is turned off. "Peek and track." |
| Passive Sonar + Active Sonar | Passive detects and bears; active pings for range/depth only when needed. Minimizes emission time. |
| Satellite SAR + Airborne EO/IR | Satellite sees through clouds to detect positions; airborne EO/IR confirms identity. Different altitudes = different terrain masking. |
| AWACS Radar + Fighter ELINT | AWACS provides God's-eye picture from safe distance; fighter ELINT identifies specific threat types in the formation. |
| Sonobuoy Net + Towed Array | Sonobuoys provide wide-area detection grid; towed array focuses on contacts for classification. Area + point sensors. |

---

## Sensor Performance Degradation Factors

| Factor | Affected Sensors | Degradation Level |
|--------|-----------------|-------------------|
| Rain (light) | EO, IR | -20% to -30% range |
| Rain (heavy) / Storm | EO, IR, Radar (clutter) | -50% to -70% range |
| Fog | EO | -80% range; IR: -30% |
| Snow / Blizzard | EO, IR | -60% range |
| Sandstorm | All except sonar | -40% to -60% range |
| Night (no illumination) | EO (without NVG) | -90% range; IR: +20% (thermal contrast) |
| Cold (< -20°C) | All electronics | -20% reliability; battery drain +50% |
| Thermocline (ocean) | Sonar | Creates shadow zones (variable) |
| Urban terrain | Radar (ground clutter), EO/IR (LOS), Acoustic (ambient) | Highly variable, generally severe |
| Forest canopy | EO (from above), SAR (partially) | -70% overhead detection |
| Mountains | Radar (shadow zones), Comms (LOS blocked) | Terrain-dependent dead zones |
| Aurora / Solar storm | OTH Radar, GPS, HF comms | Intermittent to total blackout |
