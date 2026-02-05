# Rimworld — Emergent Depth Analysis

> Rimworld's design philosophy: simple systems that intersect to create complex emergent behavior. NEXUS follows this principle.

---

## The Core Philosophy

Each Rimworld system is trivially simple in isolation:

- **Temperature:** A number (°C)
- **Mood:** A bar (0-100)
- **Health:** A list of body parts with conditions
- **Skills:** Numbers that increase with use
- **Needs:** Bars that deplete over time

A child could understand any single system.

**The depth comes from intersections:**

```
Cold temperature
    → Colonist gets "cold" mood debuff
    → Crops die
    → Food shortage
    → Hunger mood debuff
    → Mental break
    → Colonist attacks another colonist
    → Injury
    → Infection
    → Death
```

None of these systems are complex. Together, they create emergent narratives.

---

## System Intersection Matrix

Rimworld systems affect each other:

| System | Affects |
|--------|---------|
| Temperature | Mood, crops, fire, hypothermia |
| Mood | Mental breaks, work speed, social |
| Health | Work capability, mood, death |
| Skills | Work quality, research speed |
| Social | Mood, relationships, mental breaks |
| Weather | Temperature, farming, fires |

**NEXUS equivalent:**

| System | Affects |
|--------|---------|
| Weather | Sensor range, mobility, visibility |
| Terrain | Line of sight, cover, movement speed |
| Sensors | Detection, confidence, emission |
| EMCON | Signature, detection range, network |
| Network | Data sharing, latency, coordination |
| Logistics | Endurance, availability, positioning |

Each NEXUS system should be simple alone but interconnected.

---

## Tooltips That Chain

Rimworld's tooltip design is exemplary:

**Mood: 35 (Minor break risk)**
- Base mood: 50
- Cold: -8 (bedroom at 3°C)
- Hungry: -4 (haven't eaten in 8 hours)
- Saw corpse: -3 (raw shock)
- Comfortable: +5 (good furniture)
- **→ Why is bedroom cold?** [click] Heater is off
- **→ Why is heater off?** [click] No power
- **→ Why no power?** [click] Solar panels at night, no battery

Every effect chains back to its cause. Players can debug their colony.

**NEXUS adoption:**

**Detection Confidence: 67%**
- SPECTER-3 radar: +40% (45 km range, clear LOS)
- SPECTER-7 IR: +15% (12 km range, thermal contrast)
- Time decay: -8% (12 seconds since last update)
- Weather penalty: -5% (light rain, IR degraded)
- **→ Why IR degraded?** [click] Rain reduces IR range by 25%
- **→ Why radar contributes more?** [click] Radar unaffected by rain

---

## Storyteller Pacing

Rimworld's AI directors (Cassandra, Randy, Phoebe) control event pacing:

- **Rising tension:** Increasing difficulty over time
- **Crisis peak:** Major raid or disaster
- **Breathing room:** Recovery period after crisis
- **Repeat**

This creates narrative rhythm without scripted events.

**NEXUS adoption:**

Mission pacing follows similar curves:
1. **Setup:** Player establishes sensor coverage (low tension)
2. **Build:** Contacts appear, picture builds (rising tension)
3. **Crisis:** Enemy counteraction or time pressure (peak)
4. **Resolution:** Engagement outcome (climax)
5. **Assessment:** BDA, repositioning (falling action)

The campaign as a whole follows this at larger scale (easy early missions → escalating difficulty → theater-level crises).

---

## Emergent Narratives

Rimworld players share stories that emerge from system interactions:

> "A cold snap killed my crops. My colonist got sad about hunger. During a raid, she had a mental break and wandered into the crossfire. The doctor who could have saved her was already treating another wounded colonist. She died. Then the OTHER colonist died because the doctor stopped to mourn. Then the DOCTOR died because she was alone against the remaining raiders."

The game didn't script this. Systems intersected.

**NEXUS should generate similar stories:**

> "A storm degraded my EO/IR coverage. I had to switch to radar, which the enemy ELINT detected. They vectored a strike toward my recon swarm. I tried to go EMCON strict and evade, but the storm degraded my datalink — I couldn't warn the strike package. They flew into an ambush because they expected sensor coverage that wasn't there."

Weather → sensors → emissions → network → engagement. Emergent outcome.

---

## Pause-At-Will Design

Rimworld embraces pausing:
- Pause is ENCOURAGED, not penalized
- Complex decisions happen while paused
- Fast-forward is for boring moments

The game is designed FOR pause, not DESPITE pause.

**NEXUS adoption:**

- Pause is a core command tool
- All orders can be issued while paused
- Queuing commands while paused is expected workflow
- Speed 100× exists for "nothing is happening" phases

---

## What Rimworld Lacks (Not Applicable to NEXUS)

- **Individual character personalities** — NEXUS has swarms, not individuals
- **Base building** — NEXUS has FOBs but no construction gameplay
- **Colony survival** — NEXUS is mission-based, not survival

---

## Design Principles Extracted

1. **Each system should be explainable in one sentence**
   - "Radar detects targets but enemies can detect your radar"
   - NOT "Radar uses pulse-Doppler frequency modulation with..."

2. **Intersections create depth**
   - Weather affects sensors affects detection affects engagement
   - No single system should exist in isolation

3. **Tooltips are documentation**
   - If a player asks "why is this happening?" the tooltip should answer
   - Chain tooltips to root causes

4. **Pacing has rhythm**
   - Tension builds, peaks, releases
   - Breathing room is part of design

5. **Let stories emerge**
   - Design systems that CAN interact unexpectedly
   - Don't script outcomes; let players discover emergent combinations

---

## Summary

Rimworld proves that apparent complexity can arise from simple intersecting systems. NEXUS should be:

- **Individually simple:** Each system learnable in one mission
- **Collectively deep:** Systems intersect to create emergence
- **Self-documenting:** Tooltips explain everything
- **Pauseable:** Complexity is manageable with time control
- **Emergent:** The best moments aren't scripted
