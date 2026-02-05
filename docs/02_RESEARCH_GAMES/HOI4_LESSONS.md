# Hearts of Iron IV — Design Analysis

> What HOI4 does brilliantly and where it fails. NEXUS learns from both.

---

## What HOI4 Gets Right

### 1. Time Control is Perfect

The 5-speed system + active pause is the gold standard:

| Speed | Use Case |
|-------|----------|
| Pause | Planning, orders, reading tooltips |
| 1× | Critical battles, micro-management |
| 2× | Active front management |
| 3× | Default play speed |
| 4× | Waiting for production/research |
| 5× | Nothing happening, skip months |

**Key insight:** Players use ALL speeds. Design must support constant speed switching.

**NEXUS adoption:** Direct copy. 1×/3×/10×/30×/100× + active pause.

### 2. Interlocking Systems Create Depth

HOI4's web of systems:
```
Combat effectiveness
    ↑
├── Division template (design)
├── Equipment (production)
├── Supply (railways + convoys)
├── Air superiority (air wings)
├── Organization (doctrine)
├── Terrain + weather
└── General traits
```

Changing one thing cascades through the system. This creates meaningful decisions.

**NEXUS adoption:** Sensor coverage ↔ detection ↔ kill chain ↔ strike ↔ logistics ↔ economy

### 3. Tooltips Show the Math

Hovering over any value shows:
- Base value
- Every modifier (+/-)
- Source of each modifier
- Final calculated value

Players who care can understand exactly WHY something is happening.

**NEXUS adoption:** Every sensor reading, every confidence value must have a tooltip breakdown.

### 4. Map Modes

Different overlays for different information:
- Political (borders, relations)
- Strategic (supply, infrastructure)
- Air (air regions, superiority)
- Naval (sea zones, convoy routes)

**NEXUS adoption:** Sensor overlay, threat assessment, weather, logistics, EW spectrum, political.

---

## What HOI4 Gets Wrong

### 1. The Learning Cliff

New player experience:
1. Start game
2. Presented with 50+ buttons, 6 map modes, research tree, production queue, division designer, national focuses, political advisors...
3. Click random things
4. Lose war
5. Watch YouTube video
6. Still confused
7. Quit or commit to 20+ hours of learning

**The problem:** HOI4 assumes you'll read a wiki. Most players won't.

**NEXUS solution:** Progressive disclosure. Mission 1 has 4 drones and one objective. UI elements unlock as player learns systems.

### 2. Opaque Failure States

When your army collapses in HOI4, you often don't know why:
- Was it supply?
- Organization?
- Equipment?
- Air attacks?
- Encirclement?
- Division template?

The feedback loop is broken. You lose, but learning from the loss requires external research.

**NEXUS solution:** Explicit failure feedback. "Mission failed: Your recon swarm was detected because active radar revealed your position. Consider using passive sensors for approach."

### 3. UI Density Without Hierarchy

HOI4's UI shows everything at equal visual weight:
- Critical information (your troops are dying)
- Trivial information (advisor available)
- Both get the same notification style

Players develop notification blindness.

**NEXUS solution:** Ruthless information hierarchy. Threats = red, urgent. Information = cyan, calm. Routine = dim, ignorable.

### 4. Tutorial is Useless

HOI4's tutorial teaches you to:
- Move units
- Assign generals
- Start research

It does NOT teach you:
- Why your units need supply
- How to design a division
- What air superiority does
- Why your navy is losing

**NEXUS solution:** No tutorial. Missions ARE the tutorial. Each mission teaches exactly one system through gameplay.

---

## Specific Mechanics to Study

### Division Designer
HOI4's division designer is:
- ✓ Deep (endless optimization possible)
- ✓ Meaningful (good templates win wars)
- ✗ Impenetrable to new players
- ✗ "Solved" by meta templates online

**NEXUS equivalent:** Swarm composition. Should be meaningful but not require optimization research.

### Production System
- ✓ Factories as shared resource across needs
- ✓ Production efficiency curve (switching costs)
- ✗ Confusing MIC/CIC/NIC distinction

**NEXUS equivalent:** Manufacturing resource, simpler categories.

### Air Combat
HOI4's air system is:
- ✓ Strategically important
- ✗ Almost entirely opaque
- ✗ "Assign fighters, hope for the best"

**NEXUS equivalent:** Make sensor coverage AS visible as HOI4 makes ground combat.

---

## Summary: Learn From HOI4

| Adopt | Avoid |
|-------|-------|
| Time control (5-speed + pause) | Dump everything at once |
| System interconnection | Opaque causation |
| Tooltip math breakdowns | UI density without hierarchy |
| Map mode overlays | Useless tutorials |
