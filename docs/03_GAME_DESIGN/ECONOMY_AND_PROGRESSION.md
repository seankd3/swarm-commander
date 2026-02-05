# Economy and Progression System

> Resources, tech tree, and campaign progression that create strategic depth without overwhelming complexity.

---

## Design Intent

The economy exists to create **meaningful scarcity**. The player can't do everything — they must prioritize. But the economy should:
- Be learnable in one mission
- Create interesting choices
- Not require spreadsheet optimization

---

## Five Resource System

### 1. Compute Cycles (CC)

**What it represents:** Processing power for swarm coordination
**Limits:** Number of simultaneous swarms
**Regenerates:** Automatically over time
**Spent:** By deploying swarms

| Compute Level | Max Active Swarms |
|---------------|-------------------|
| Basic | 2 |
| Standard | 4 |
| Advanced | 6 |
| Theater | 8+ |

**Strategic choice:** More swarms = more coverage but diluted attention

### 2. Manufacturing (MFG)

**What it represents:** Platform production capacity
**Limits:** Replacement rate for losses
**Regenerates:** Per tick based on FOB count
**Spent:** Building new platforms

| Manufacturing Level | Platforms/Hour |
|--------------------|----------------|
| Minimal | 1 |
| Standard | 3 |
| Industrial | 6 |
| Surge | 10 |

**Strategic choice:** Aggressive play burns through MFG; cautious play accumulates reserves

### 3. Logistics Points (LP)

**What it represents:** Supply chain capacity
**Limits:** How far and how long swarms can operate
**Regenerates:** Based on supply routes
**Spent:** Distance from FOB × time deployed

```
lp_cost_per_tick = distance_from_fob / 100 × swarm_size
```

**Strategic choice:** Forward deployment costs more LP; rear positioning costs time

### 4. Intel Credits (IC)

**What it represents:** Intelligence agency support
**Limits:** Frequency of intel purchases
**Regenerates:** Slowly (narrative events)
**Spent:** Buying intel packages

Intel packages:
| Package | Cost | Provides |
|---------|------|----------|
| Satellite pass | 10 IC | One-time coverage of area |
| SIGINT burst | 15 IC | Enemy order of battle in region |
| HUMINT report | 25 IC | Enemy intentions/plans |
| Target package | 20 IC | Specific target location revealed |

**Strategic choice:** Save IC for critical moments or spend for continuous advantage

### 5. Political Capital (PC)

**What it represents:** Command authority and political support
**Limits:** What actions you can authorize
**Regenerates:** Mission success; lost on failures/collateral
**Spent:** Aggressive actions, escalation

| Action | PC Cost |
|--------|---------|
| Standard engagement | 0 |
| Strike in restricted zone | 10 |
| Collateral damage (per incident) | -20 |
| Mission failure | -15 |
| Mission success | +10 |
| Civilian casualties | -50 |

If PC reaches 0: campaign failure (political removal)

**Strategic choice:** Aggressive play risks PC; cautious play preserves options

---

## Tech Tree

### Structure

5 branches × 10 tiers = 50 unlockables

```
SENSORS ─── PLATFORMS ─── WEAPONS ─── NETWORK ─── DOCTRINE
   │            │            │           │           │
  T1           T1           T1          T1          T1
   │            │            │           │           │
  T2           T2           T2          T2          T2
   │            │            │           │           │
  ...          ...          ...         ...         ...
   │            │            │           │           │
  T10          T10          T10         T10         T10
```

### Branch Descriptions

**SENSORS:** Improve detection capability
- T1: Basic radar enhancement (+10% range)
- T3: ELINT processing (faster classification)
- T5: Multi-spectral fusion (fusion bonus +0.1)
- T7: Quantum sensing (stealth detection)
- T10: Persistent surveillance (no confidence decay)

**PLATFORMS:** Unlock new platform types
- T1: SPECTER Mk.II (improved endurance)
- T3: WHISPER EW platform unlocked
- T5: ORCA maritime platform unlocked
- T7: SENTINEL satellite constellation
- T10: HAMMER orbital strike (ultimate weapon)

**WEAPONS:** Improve engagement capability
- T1: Improved warheads (+15% damage)
- T3: ARM capability (anti-radiation missiles)
- T5: Extended range missiles
- T7: Cooperative engagement (multiple weapons, one target)
- T10: Hypersonic strike

**NETWORK:** Improve coordination
- T1: Datalink enhancement (less latency)
- T3: Mesh networking (no single point of failure)
- T5: Secure comms (jam-resistant)
- T7: Distributed processing (CC +2)
- T10: Perfect fusion (all swarms share all data instantly)

**DOCTRINE:** Improve swarm behavior
- T1: Improved reactive layer (faster threat response)
- T3: Advanced tactical coordination
- T5: Adaptive learning enabled
- T7: Autonomous swarming (Autonomy more effective)
- T10: AI supremacy (swarm AI nearly optimal)

### Tech Research

- Research points earned from missions
- Points allocated to branches freely
- Higher tiers cost more points
- Tier N requires Tier N-1 in same branch

---

## FOBs (Forward Operating Bases)

### FOB Functions

| Function | Effect |
|----------|--------|
| Spawn point | Swarms deploy from FOBs |
| Resupply | ATLAS/MULE return here to reload |
| Manufacturing | MFG generated per FOB |
| Sensor node | Persistent sensor coverage around FOB |
| Network hub | Datalink relay point |

### FOB Types

| Type | Cost | Capability |
|------|------|------------|
| Temporary | Low | Limited (1 swarm, no MFG) |
| Standard | Medium | Normal (2 swarms, standard MFG) |
| Major | High | Enhanced (4 swarms, 2× MFG, extended sensors) |

### FOB Placement

- Pre-placed in most missions
- Some missions allow FOB establishment
- FOBs can be attacked and destroyed

---

## Campaign Progression

### Mission Rewards

Each mission grants:
- Research points (based on performance)
- IC bonus (for intel objectives)
- PC change (based on outcome/collateral)
- Sometimes: new platform unlock

### Performance Grades

| Grade | Condition | Research Bonus |
|-------|-----------|----------------|
| S | All objectives, no losses | 150% |
| A | All objectives, minimal losses | 125% |
| B | Primary objectives complete | 100% |
| C | Some objectives, high losses | 75% |
| D | Barely passed | 50% |

### Difficulty Scaling

Difficulty affects:
- Enemy AI quality (parameters)
- Resource availability
- Intel accuracy
- PC tolerance

---

## Economic UI

### Resource Bar (Always Visible)

```
[CC: 4/6] [MFG: 24] [LP: 150/200] [IC: 45] [PC: 72]
```

Color coding:
- Green: healthy
- Yellow: below 30%
- Red: critical (<10%)

### Economic Panel (Toggle)

Detailed breakdown:
- Income/outflow per tick
- Projections (will run out in X minutes)
- Breakdown by swarm (which swarms cost most LP)

---

## Balance Philosophy

### Scarcity Creates Choice

If player can do everything, economy is pointless.
Resources should force: "I can do A OR B, not both"

### Visible Consequences

When spending resources, show what you're giving up:
- "Deploy SWARM-5? LP: 150→120 (will sustain 2 hours at current ops)"

### Comeback Mechanics

Resources shouldn't death spiral:
- Minimum MFG even with 0 FOBs
- IC regenerates slowly regardless
- PC floor prevents instant campaign failure

### No Optimal Path

Each resource should have multiple valid spending strategies:
- Aggressive: burn LP for forward positioning
- Cautious: save MFG for attrition campaign
- Intel-heavy: spend IC for information advantage
- Tech-rush: minimize spending, maximize research
