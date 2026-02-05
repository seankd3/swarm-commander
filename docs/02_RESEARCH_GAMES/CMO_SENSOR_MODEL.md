# Command: Modern Operations — Sensor Model Analysis

> CMO is the gold standard for sensor simulation. NEXUS borrows its detection model while improving accessibility.

---

## CMO's Detection Philosophy

CMO treats detection as a **progression**, not a binary:

```
UNDETECTED → DETECTED → CLASSIFIED → IDENTIFIED
```

Each stage requires:
- Different sensor investment
- Time
- Often different sensor types

This is the most realistic and gameable detection model in any simulation.

---

## The Three-Tier Detection Model

### Tier 1: Detection
**Question:** "Is something there?"
**Sensor contribution:** Range-based probability check
**Output:** A contact exists at approximately (x, y)

In CMO, detection happens when:
```
detection_probability = sensor_capability / (range² × target_signature × environment)
```

Rolling above threshold → contact appears.

### Tier 2: Classification
**Question:** "What kind of thing is it?"
**Sensor contribution:** Continued observation + sensor type bonuses
**Output:** Contact type (aircraft, surface ship, submarine, ground vehicle)

CMO uses a classification timer that ticks based on sensor quality. Better sensors classify faster.

### Tier 3: Identification
**Question:** "What specific thing is it?"
**Sensor contribution:** High-resolution sensors, ELINT signature matching
**Output:** "MiG-29A, hostile, tail number 234"

Full identification often requires:
- EO/IR for visual recognition
- ELINT for specific emitter matching
- Close range observation

---

## What NEXUS Adopts from CMO

### 1. Probabilistic Detection
No binary "in range = seen." Detection is a probability influenced by:
- Sensor power
- Range
- Target signature
- Environment

NEXUS simplifies: continuous confidence accumulation rather than per-tick probability rolls.

### 2. Sensor-Specific Detection Rates
Different sensors detect different target types at different rates:

| Sensor | Air Targets | Ground Targets | Maritime |
|--------|-------------|----------------|----------|
| Radar | Fast | Medium (clutter) | Medium |
| EO/IR | Medium | Fast (close range) | Fast (visual) |
| ELINT | If emitting: instant | If emitting: instant | If emitting: instant |
| Sonar | N/A | N/A | Varies by conditions |

CMO models this per-sensor-per-target-type. NEXUS uses a simpler classification_speed_multiplier per sensor.

### 3. EMCON System
CMO's emission control:
- **Tight:** All sensors passive, comms minimized
- **Limited:** Defensive sensors only
- **Active:** Normal emissions
- **Unlimited:** Maximum power, all sensors on

NEXUS adopts four EMCON levels with similar behavior.

### 4. Track Fading
In CMO, contacts "fade" when you lose sensor coverage:
- Position uncertainty grows
- Eventually contact drops below detection threshold
- Contact disappears (but may still be there)

NEXUS: confidence decay + position uncertainty growth.

---

## What NEXUS Simplifies from CMO

### 1. Parameter Count
CMO has hundreds of sensor parameters. NEXUS uses ~10 per sensor:
- max_range
- sensor_power
- field_of_view
- update_interval
- is_active
- emission_signature
- classification_bonus
- (a few mode-specific)

### 2. Real-Time vs. Tick-Based
CMO uses continuous real-time simulation with variable timestep.
NEXUS uses discrete game-ticks (Paradox-style) for more predictable behavior.

### 3. Database Complexity
CMO's database (cmo-db.com) has thousands of real-world platforms.
NEXUS has ~30 fictional platforms with clear gameplay roles.

### 4. Accessibility
CMO's target audience: military professionals and hardcore sim enthusiasts.
NEXUS's target audience: strategy gamers who watch military YouTube.

---

## CMO's Weaknesses (NEXUS Opportunities)

### 1. Scenario Setup is Hard
Building a CMO scenario requires hours of platform placement, loadout configuration, sensor setup.

**NEXUS:** Missions are pre-designed. Player commands, doesn't configure.

### 2. UI is Utilitarian
CMO looks like a professional tool because it is one.

**NEXUS:** Modern, game-quality UI inspired by Palantir/Lattice aesthetics.

### 3. Time Scale Confusion
CMO's time acceleration can feel sluggish or jerky.

**NEXUS:** Clean 5-speed with explicit player control.

### 4. No Teaching
CMO manual is 500+ pages. The game teaches nothing.

**NEXUS:** Missions teach. No manual needed.

---

## Key CMO Scenarios to Study

1. **"Chains of War"** — Sensor-dense environment, network effects
2. **"Northern Inferno"** — ASW focus, acoustic modeling
3. **"Silent Service**" — Submarine sensor gameplay
4. **Community scenarios** — See how players use the system

---

## Summary

CMO proves that sensor-based gameplay can be deep and satisfying. NEXUS takes CMO's detection model, simplifies the parameter count, and wraps it in accessible game design.

| CMO | NEXUS |
|-----|-------|
| Professional simulation | Consumer game |
| Realistic parameter counts | Abstracted for gameplay |
| Assumes expertise | Teaches through play |
| 500-page manual | No manual |
| Utilitarian UI | Polished game UI |
