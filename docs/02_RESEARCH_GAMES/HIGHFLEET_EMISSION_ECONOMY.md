# Highfleet — Emission Economy Analysis

> Highfleet's "emit to see = be seen" loop is the purest expression of sensor tension in games. NEXUS must capture this feeling.

---

## The Core Loop

Highfleet's genius is a single rule:

**ELINT detection range ≈ 2× Radar detection range**

This means:
- Your radar sees enemy at 150 km
- Enemy ELINT detected YOUR radar at 300 km
- They knew you were looking before you found them

This single rule creates the entire game's tension.

---

## How It Feels to Play

### The Tension Moment
You're flying through hostile territory. You know enemies are out there. Do you:

1. **Stay silent (EMCON strict)**
   - You can't see anything
   - But they can't see you either
   - Unless they turn on THEIR radar... then you see them
   - Creeping blind through hostile space

2. **Ping radar**
   - One sweep: suddenly you see contacts
   - But you've just announced your presence
   - Enemy ELINT platforms now have your bearing
   - Strike groups are vectoring toward you
   - Clock is ticking

3. **Use IRST (passive infrared)**
   - Shorter range than radar
   - But completely silent
   - Lets you close the gap without announcing yourself

This three-way choice is the entire game.

---

## The Sensor Triangle

```
        RADAR
       /      \
      /        \
   ELINT ———— IRST
```

- **Radar** sees everything but is loud
- **ELINT** sees radar users but not silent targets
- **IRST** sees silent targets but only up close

Each has a counter. Each enables a counter.

---

## Anti-Radiation Weapons

Highfleet adds ARMs (missiles that home on radar):
- Keep radar on → ARM kills you
- Turn radar off → you're blind
- Emit intermittently → ARM is less accurate

This adds urgency to the radar decision. It's not just "they see you." It's "something is flying toward your radar dish."

---

## Jammers: Double-Edged Sword

Highfleet's jammers:
- ✓ Blind enemy radar in your area
- ✗ Your jammer is the brightest thing on ELINT
- The enemy can't see THROUGH you, but they know EXACTLY where you are

Jammers trade radar protection for ELINT vulnerability. Not a win button — a tradeoff.

---

## What NEXUS Adopts from Highfleet

### 1. The 2× Rule
Fundamental to NEXUS:
```
elint_detection_range = radar_range × 2.0
```

This is non-negotiable. It's the core of the emission economy.

### 2. EMCON as Constant Decision
Every swarm has an EMCON setting. Player adjusts constantly:
- Approaching: STRICT (passive only)
- Observing: LIMITED (defensive sensors)
- Engaging: AGGRESSIVE (everything on)

### 3. Jammers as Tradeoffs
WHISPER EW swarms:
- Protect friendly forces from radar
- But become ELINT beacons
- Can be targeted by ARMs
- Require protection OR acceptance of sacrifice

### 4. The Tension
NEXUS must recreate the feeling of "do I turn on radar?"
- The uncertainty of staying silent
- The relief of seeing contacts
- The dread of knowing you've been seen

---

## What NEXUS Expands from Highfleet

### 1. Scale
Highfleet is small-scale (fleet vs. fleet in a region).
NEXUS is globe-scale (theater-wide sensor coverage).

The 2× rule still applies, but across much larger distances with more actors.

### 2. Sensor Diversity
Highfleet has ~3 sensor types.
NEXUS has 10+ sensor types, each with the same tradeoff logic:
- Active sonar: same 2× rule underwater
- SAR radar: emissions detectable
- Even IFF interrogation: brief emission

### 3. Network Effects
Highfleet is mostly single-ship.
NEXUS involves sensor networks:
- One ship's radar + another's ELINT = better picture
- Destroying network nodes degrades enemy capability
- Counter-network warfare as strategy

### 4. Time Scale
Highfleet is real-time with limited pause.
NEXUS is fully pauseable with speed control.
The tension moment can be stretched — pause, think, decide, act.

---

## The Feeling to Capture

When a NEXUS player turns on radar, they should feel:

1. **Before:** Anxiety (do I need to? what will I see? what will see me?)
2. **During:** Information rush (contacts appearing, picture building)
3. **After:** Tension (now they know where I am, clock is ticking)

This emotional arc — not the technical simulation — is what makes Highfleet great. NEXUS must recreate it.

---

## Key Highfleet Moments to Study

1. **First contact ping** — the tutorial mission where you learn radar reveals you
2. **Nuclear cities** — dense ELINT coverage makes radar suicidal
3. **Ambush setups** — using ELINT to detect enemy radar, closing on IRST
4. **ARM dodging** — the panic of "radar lock warning" and shutting down

Play Highfleet. Feel the tension. That's what NEXUS needs.
