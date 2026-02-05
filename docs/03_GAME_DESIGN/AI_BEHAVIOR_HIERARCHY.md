# AI Behavior Hierarchy

> The four-layer swarm AI system that enables autonomous operation with player oversight.

---

## Design Intent

Swarm AI should be:
1. **Competent** — Makes reasonable decisions without constant guidance
2. **Predictable** — Player can understand why it did something
3. **Tunable** — Behavioral parameters change behavior meaningfully
4. **Overridable** — Player can always intervene

---

## The Four Layers

```
┌─────────────────────────────────────┐
│         ADAPTIVE LAYER              │  Learning, pattern recognition
│      (longest time horizon)         │
├─────────────────────────────────────┤
│       OPERATIONAL LAYER             │  Objective pursuit, route planning
│     (mission time horizon)          │
├─────────────────────────────────────┤
│        TACTICAL LAYER               │  Formation, coordination, targeting
│    (engagement time horizon)        │
├─────────────────────────────────────┤
│        REACTIVE LAYER               │  Immediate threats, survival
│     (instant time horizon)          │
└─────────────────────────────────────┘
```

Higher layers set goals. Lower layers handle execution. Lower layers can interrupt higher layers.

---

## Layer 1: Reactive (Survival)

**Time horizon:** Immediate (0-5 seconds)
**Purpose:** Keep the swarm alive

### Reactive Behaviors

| Trigger | Response |
|---------|----------|
| Missile inbound | Deploy countermeasures, evade |
| Hostile weapons lock (RWR spike) | Break lock (maneuver, EMCON) |
| Collision imminent | Avoid |
| Platform critical damage | That platform RTBs |
| SAM radar lock | Terrain mask or egress |

### Reactive Layer Parameters

- **Sensitivity** controlled by Persistence parameter
  - Low persistence: react to everything
  - High persistence: only react to critical threats

### Interruption Rules

Reactive layer CAN interrupt any higher layer.
Reactive responses are IMMEDIATE.

---

## Layer 2: Tactical (Engagement)

**Time horizon:** Seconds to minutes
**Purpose:** Win the current engagement

### Tactical Behaviors

| Behavior | Description |
|----------|-------------|
| Formation control | Maintain dispersion based on parameter |
| Fire coordination | Avoid overkill, distribute targets |
| Sensor coordination | Different platforms cover different modes |
| BDA execution | Post-strike sensor pass |
| Support coordination | EW/recon supports strike |

### Tactical Decision Examples

**Engagement:**
- Enemy contact at Track confidence
- 4 HORNET platforms available
- Tactical layer decides: 2 HORNETs engage, 2 reserve
- Distributes approach vectors to avoid mutual interference

**Formation:**
- Dispersion parameter = 0.7 (wide)
- Tactical layer spreads platforms 5-10 km apart
- Maintains sensor overlap while maximizing coverage

### Tactical Layer Parameters

- **Aggression** affects engagement posture
- **Dispersion** affects formation geometry
- **Stealth** affects sensor usage during engagement

---

## Layer 3: Operational (Mission)

**Time horizon:** Minutes to hours
**Purpose:** Accomplish the assigned objective

### Operational Behaviors

| Behavior | Description |
|----------|-------------|
| Route planning | Navigate to objective area |
| Search patterns | Cover search area efficiently |
| Objective pursuit | Work toward completion conditions |
| Resource management | Fuel/ammo awareness, RTB when needed |
| Coordination | Deconflict with other swarms |

### Operational Decision Examples

**Route Planning:**
- Objective: search area 200 km away
- Threat: SAM site along direct route
- Operational layer plans: route around SAM coverage
- Considers: fuel cost vs. threat avoidance

**Search Pattern:**
- Objective: find submarine in 100 km × 100 km area
- Operational layer generates: expanding spiral OR parallel tracks
- Based on: sensor ranges, platform count, time available

### Operational Layer Parameters

- **Autonomy** affects whether route changes need approval
- **Persistence** affects objective pursuit vs. self-preservation

---

## Layer 4: Adaptive (Learning)

**Time horizon:** Multiple engagements
**Purpose:** Improve based on experience

### Adaptive Behaviors

| Behavior | Description |
|----------|-------------|
| Threat assessment | Learn which enemy types are dangerous |
| Route preference | Remember which routes were safe |
| Tactic adjustment | What worked in similar situations |
| Pattern recognition | Enemy behavior prediction |

### Adaptive Examples

**Threat Learning:**
- Previous mission: SAM site shot down 2 platforms
- Adaptive layer updates: increase avoidance radius for SAM sites
- Future missions: operational layer routes further from SAMs

**Tactic Adjustment:**
- Previous engagement: frontal approach, 50% losses
- Adaptive layer notes: flanking approach, 10% losses
- Future engagements: tactical layer prefers flanking

### Adaptive Persistence

Adaptive learning persists:
- Within a mission (short-term)
- Across campaign (if same swarm survives)
- Resets on new campaign

### Adaptive Layer Parameters

- Enabled/disabled based on tech tree (advanced AI upgrade)
- Learning rate modifiable

---

## Layer Interaction

### Information Flow

```
ADAPTIVE: "SAM sites are very dangerous"
    ↓
OPERATIONAL: "Route around all SAM coverage"
    ↓
TACTICAL: "Maintain formation that can scatter if SAM locks"
    ↓
REACTIVE: [SAM LOCK] "Scatter and evade NOW"
```

### Interruption Cascade

Lower layers can interrupt higher:
- Reactive interrupts Tactical (survival > engagement)
- Reactive interrupts Operational (survival > mission)
- Tactical can interrupt Operational (engagement opportunity)

### Resolution Hierarchy

When layers conflict:
1. Reactive wins for survival situations
2. Player commands override all layers
3. Operational wins for mission-critical
4. Tactical handles everything else

---

## Autonomy Integration

The Autonomy parameter affects which decisions go to the player:

| Autonomy | Reactive | Tactical | Operational | Adaptive |
|----------|----------|----------|-------------|----------|
| 0.0-0.3 | Autonomous | Approval needed | Approval needed | Disabled |
| 0.4-0.6 | Autonomous | Autonomous | Major changes need approval | Enabled |
| 0.7-1.0 | Autonomous | Autonomous | Autonomous (notification only) | Enabled |

---

## AI Transparency

Player can see AI decision-making:

### Swarm Thought Display
Optional overlay showing:
- Current layer active
- Current goal/behavior
- Why (brief explanation)

Example:
```
SPECTER SWARM 3
[Operational] En route to search area
 → Direct route blocked by SAM-3
 → Routing via waypoint ALPHA
[ETA: 12:35]
```

### Decision Log
Reviewable log of AI decisions:
```
12:20:15 [Reactive] Threat detected - deploying countermeasures
12:20:18 [Tactical] Breaking formation to evade
12:20:45 [Operational] Threat passed - resuming route
12:21:00 [Adaptive] Logged: SAM-3 at coordinates X engaged at range 40km
```

---

## Enemy AI

Enemy forces use the same 4-layer system with different parameters:

| Enemy Type | Aggression | Persistence | Stealth | Autonomy |
|------------|------------|-------------|---------|----------|
| Patrol | 0.3 | 0.3 | 0.5 | 0.7 |
| Defense | 0.5 | 0.7 | 0.3 | 0.6 |
| Strike | 0.8 | 0.8 | 0.6 | 0.8 |
| Elite | 0.6 | 0.9 | 0.8 | 0.9 |

This creates varied enemy behavior using the same system.

---

## Implementation Notes

### Performance Budget

- Reactive: runs every frame (must be fast)
- Tactical: runs every 0.5 seconds
- Operational: runs every 5 seconds
- Adaptive: runs end-of-engagement

### State Machine vs. Behavior Tree

Recommended: **Behavior Tree** for each layer
- Reactive: simple selector (threat response)
- Tactical: priority selector (engagement behaviors)
- Operational: sequence (mission execution)
- Adaptive: decorator nodes (modify child behaviors)

See ARCHITECTURE/ECS_DESIGN.md for component structure.
