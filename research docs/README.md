# NEXUS: Global Swarm Command — Design Documentation

> **A modern Hearts of Iron set in 2042, where sensor fusion IS the gameplay.**
> Built by one human + AI agents. Designed to teach through play, not manuals.

---

## How to Navigate This Repository

This documentation is organized for both **human reading** and **AI agent implementation**. Each folder serves a distinct purpose in the development pipeline:

### Document Structure

```
NEXUS_Design/
│
├── 00_VISION/                          ← START HERE. What the game IS.
│   ├── GAME_VISION.md                  # Elevator pitch, design pillars, what makes it unique
│   └── LEARNING_CURVE_DESIGN.md        # How the game teaches itself (tactical → theater)
│
├── 01_RESEARCH_EXTERNAL/               ← Real-world military doctrine & technology
│   ├── NCW_DOCTRINE.md                 # Network Centric Warfare fundamentals, kill chain
│   ├── SENSOR_SYSTEMS.md               # Real-world sensor specs, ranges, capabilities
│   ├── CONFLICT_SCENARIOS.md           # Taiwan, Arctic, SCS, Baltic — real analysis
│   ├── PLATFORM_REFERENCE.md           # Real military platforms as design references
│   └── EW_DOCTRINE.md                  # Electronic warfare doctrine and countermeasures
│
├── 02_RESEARCH_GAMES/                  ← What other games do well (and poorly)
│   ├── HOI4_LESSONS.md                 # Time system, depth, learning curve failures
│   ├── CMO_SENSOR_MODEL.md             # Command Modern Ops — gold standard sensor sim
│   ├── HIGHFLEET_EMISSION_ECONOMY.md   # The "emit to see = be seen" loop
│   ├── VTOL_VR_SENSOR_FEEL.md          # Making sensor interaction satisfying
│   ├── PA_TITANS_GLOBE_SCALE.md        # Managing globe-scale warfare
│   ├── RIMWORLD_EMERGENT_DEPTH.md      # Simple systems → complex emergent behavior
│   └── LESSONS_SYNTHESIS.md            # Cross-game design lessons distilled
│
├── 03_GAME_DESIGN/                     ← CORE SPECS. What AI agents implement from.
│   ├── SENSOR_FUSION_SYSTEM.md         # THE core system. Detection, layering, formulas
│   ├── SWARM_COMMAND_SYSTEM.md         # Behavioral parameters, swarm composition
│   ├── COMBAT_RESOLUTION.md            # Hit/damage/armor/critical systems
│   ├── AI_BEHAVIOR_HIERARCHY.md        # 4-layer swarm AI (reactive → adaptive)
│   ├── ECONOMY_AND_PROGRESSION.md      # Resources, tech tree, unlocks
│   ├── WEATHER_TERRAIN_ENVIRONMENT.md  # Environmental simulation depth
│   ├── ELECTRONIC_WARFARE.md           # Jamming, spoofing, counter-EW mechanics
│   ├── TIME_AND_SIMULATION.md          # Variable timestep, pause, speed controls
│   └── CAMPAIGN_SCENARIOS.md           # Mission design, theaters, narrative
│
├── 04_UI_UX/                           ← How the player experiences it all
│   ├── C2_INTERFACE_DESIGN.md          # Panel layout, visual language, interactions
│   ├── TUTORIAL_ONBOARDING.md          # Progressive disclosure, mission-as-tutorial
│   └── INFORMATION_HIERARCHY.md        # What shows at each zoom level, data density
│
├── 05_ARCHITECTURE/                    ← How it's built (for AI agents)
│   ├── TECHNICAL_OVERVIEW.md           # Stack, engine choices, platform targets
│   ├── ECS_DESIGN.md                   # Entity Component System structure
│   ├── MODULE_MAP.md                   # System boundaries, interfaces, dependencies
│   ├── DATA_SCHEMAS.md                 # Platform stats, sensor data, JSON schemas
│   └── PERFORMANCE_BUDGET.md           # LOD tiers, spatial partitioning, frame budget
│
├── 06_DEVELOPMENT/                     ← How work gets done
│   ├── AI_AGENT_WORKFLOW.md            # Agent assignments, review process, quality gates
│   ├── MVP_ROADMAP.md                  # Minimum viable game → full release phases
│   └── CURRENT_SPRINT.md              # Active work items (updated frequently)
│
└── 07_ASSETS/                          ← Game content specifications
    ├── PLATFORM_ROSTER.md              # All units with complete stat blocks
    └── AUDIO_DESIGN.md                 # Sound design specifications
```

### Reading Order

**If you're understanding the game:** 00_VISION → 02_RESEARCH_GAMES/LESSONS_SYNTHESIS → 03_GAME_DESIGN/SENSOR_FUSION_SYSTEM

**If you're implementing a system:** 03_GAME_DESIGN/[system] → 05_ARCHITECTURE/ECS_DESIGN → 05_ARCHITECTURE/DATA_SCHEMAS

**If you're building a scenario:** 01_RESEARCH_EXTERNAL/CONFLICT_SCENARIOS → 03_GAME_DESIGN/CAMPAIGN_SCENARIOS → 07_ASSETS/PLATFORM_ROSTER

### AI Agent Instructions

Each document in `03_GAME_DESIGN/` is written as an **implementation spec**. Formulas are explicit, edge cases documented, value ranges defined. When implementing a system:

1. Read the relevant `03_GAME_DESIGN/` doc first
2. Check `05_ARCHITECTURE/ECS_DESIGN.md` for component structure
3. Check `05_ARCHITECTURE/DATA_SCHEMAS.md` for data formats
4. Implement, test, submit for human review

### Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-05 | 2.0 | Full restructure. Sensor fusion as core loop. AI-accelerated methodology. Learning curve redesign. |
| 2026-02-05 | 1.0 | Initial GDD. Basic systems defined. |
