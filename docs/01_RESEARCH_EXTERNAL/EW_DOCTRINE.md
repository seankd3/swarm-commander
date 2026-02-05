# Electronic Warfare Doctrine

> Real-world EW concepts that inform NEXUS's jamming, deception, and counter-EW systems.

---

## EW Fundamentals

### The Three Pillars

| Pillar | Description | NEXUS Implementation |
|--------|-------------|---------------------|
| **EA** (Electronic Attack) | Degrade enemy sensors | Jamming reduces radar range |
| **EP** (Electronic Protection) | Protect own systems | Burn-through range, frequency hopping |
| **ES** (Electronic Support) | Exploit enemy emissions | ELINT detection, RWR |

---

## Jamming Types

### Noise Jamming
**Effect:** Floods radar receiver with noise, reducing effective range
**Real formula:** Radar range degrades by ~4th root of jammer power ratio
**NEXUS simplification:** Flat percentage range reduction within jamming coverage

```
effective_radar_range = base_range × (1 - jamming_effectiveness)
```

Where `jamming_effectiveness` is 0.0-0.8 based on jammer power vs. radar power.

### Deception Jamming
**Effect:** Creates false targets on enemy radar
**Real methods:** Range gate pull-off, velocity gate pull-off, false targets
**NEXUS implementation:** Spawns decoy tracks on enemy COP

### Barrage vs. Spot Jamming
- **Barrage:** Jams wide frequency range, less power per frequency
- **Spot:** Jams specific frequency, more effective but can be evaded

NEXUS uses barrage jamming by default (simpler, covers doctrine without frequency management complexity).

---

## The Jammer's Dilemma

**Core tension:** Jamming makes you the brightest target on ELINT

```
When jammer ON:
  - Enemy radar effectiveness: REDUCED
  - Your ELINT signature: MAXIMUM (detectable at 3-4x radar range)
```

This creates the risk-reward dynamic:
- Jam to protect strike package → enemy knows exactly where jammer is
- Enemy can target jammer with ARMs
- Jammer becomes sacrificial asset OR requires escort

---

## Anti-Radiation Missiles (ARM)

### How ARMs Work
1. Seeker locks onto radar emission
2. Missile flies toward emission source
3. Memory mode: if radar shuts off, ARM continues to last known position

### NEXUS ARM Mechanics
```
arm_lock_range = elint_range × 0.8
arm_accuracy = f(emitter_duty_cycle)
  - 100% duty cycle (always on): 10m CEP
  - 50% duty cycle (intermittent): 50m CEP
  - 10% duty cycle (brief sweeps): 200m CEP
```

### Counter-ARM Tactics
- **EMCON:** Don't emit, can't be targeted
- **Shoot and scoot:** Emit briefly, relocate immediately
- **Decoy emitters:** Sacrifice cheap radiators to absorb ARMs
- **Hardkill:** Intercept ARM with point defense

---

## ELINT Analysis

### What ELINT Tells You

| Parameter | Information Gained |
|-----------|-------------------|
| Frequency | Radar type identification |
| PRF (Pulse Repetition Frequency) | Specific radar model |
| Scan pattern | Search vs. track vs. lock |
| Power | Range estimation |
| Bearing | Direction to emitter |

### Geolocation Methods
- **Single platform:** Bearing only (direction, not distance)
- **Two platforms:** Triangulation (bearing intersection = position)
- **Time Difference of Arrival (TDOA):** More precise with 3+ platforms

NEXUS simplifies: single ELINT = bearing line; 2+ ELINT platforms on same emitter = position fix.

---

## Counter-EW (Electronic Protection)

### Radar Burn-Through
At close range, radar signal overcomes jamming:
```
burn_through_range = base_range × sqrt(jamming_factor)
```

Example: 150 km radar with 50% jamming effectiveness:
- Degraded range: 75 km
- Burn-through range: ~106 km

Inside burn-through range, radar sees through the jamming.

### Frequency Agility
Radar changes frequency faster than jammer can track
- **NEXUS simplification:** Advanced radars have "jam resistance" stat (0.0-0.5)
- Jamming effectiveness reduced by jam resistance

### Home-On-Jam
Instead of fighting jamming, use it as a beacon:
- Missile/weapon seeker tracks the jamming source
- Converts jammer from protection to targeting aid

---

## NEXUS EW Design Principles

1. **EW is a tradeoff, not a win button**
   - Jamming helps AND hurts (ELINT signature)

2. **Counters exist for everything**
   - Jamming countered by burn-through, frequency agility, home-on-jam
   - ARMs countered by EMCON, shoot-and-scoot, decoys

3. **EW creates windows, not solutions**
   - Jamming opens a window for strike; strike must exploit the window

4. **Positioning matters**
   - Jammer position relative to radar and striker affects standoff
   - "Escort jamming" vs. "standoff jamming" geometries
