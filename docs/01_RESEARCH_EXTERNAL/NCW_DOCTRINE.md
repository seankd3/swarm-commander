# Network Centric Warfare Doctrine

> Real-world military doctrine that informs NEXUS's core systems.

---

## Overview

Network Centric Warfare (NCW) is the military doctrine that underpins modern sensor-based combat. The core thesis: **information superiority enables combat power multiplication**.

---

## The Kill Chain (F2T2EA)

The fundamental targeting cycle that NEXUS simulates:

| Phase | Description | NEXUS Implementation |
|-------|-------------|---------------------|
| **Find** | Detect that something exists | Anomaly → Contact state |
| **Fix** | Determine precise location | Position uncertainty < 500m |
| **Track** | Maintain continuous custody | Confidence > 0.5, decay management |
| **Target** | Assign weapon/platform | Strike planning overlay |
| **Engage** | Weapons release | Combat resolution system |
| **Assess** | Confirm destruction (BDA) | Post-strike sensor pass |

### Time-Critical Targeting

Modern doctrine emphasizes **sensor-to-shooter timelines**. The faster you complete F2T2EA, the less time the target has to:
- Move (mobile targets)
- Deploy countermeasures
- Disperse/hide
- Strike first

NEXUS simulates this pressure through confidence decay and target mobility.

---

## The OODA Loop

Boyd's decision cycle that applies to both player and AI:

```
OBSERVE → ORIENT → DECIDE → ACT
   ↑                         |
   └─────────────────────────┘
```

**Whoever completes OODA faster wins.** In NEXUS:
- Better sensors = faster Observe
- Better fusion = faster Orient
- Autonomy settings = faster Decide
- Platform capabilities = faster Act

---

## Information Superiority

### The Fog of War Spectrum

```
TOTAL IGNORANCE ←────────────────────────→ COMPLETE AWARENESS
    Enemy has this                Your goal is this
```

NCW doctrine states that seeing first = shooting first = winning. NEXUS makes this the core gameplay: the player's job is to move their force rightward on this spectrum while keeping the enemy leftward.

### Sensor Netting

Multiple sensors covering the same area provide:
1. **Redundancy** — if one fails, others continue
2. **Complementary coverage** — different sensor types see different things
3. **Faster classification** — multiple data sources converge faster
4. **Reduced uncertainty** — triangulation improves position accuracy

---

## Counter-NCW: Disrupting the Network

If NCW wins through information, counter-NCW wins by denying information:

| Method | Effect | NEXUS Implementation |
|--------|--------|---------------------|
| **EMCON** | Emit nothing, become invisible | EMCON profiles per swarm |
| **Jamming** | Degrade enemy sensors | EW system, range reduction |
| **Deception** | Feed false information | Decoy emitters, spoofing |
| **Destruction** | Kill sensor platforms | SEAD/DEAD missions |
| **Cyber** | Corrupt the network | Not in MVP (future feature) |

---

## Distributed Operations

Modern doctrine emphasizes distributed, networked forces over concentrated mass:

**Traditional:** Large platforms with many sensors (aircraft carrier)
**NCW:** Many small platforms sharing data (drone swarms)

NEXUS is explicitly an NCW game: swarms of small autonomous platforms networked together.

---

## Doctrine Sources for Further Research

- [ ] "Network Centric Warfare" — Alberts, Garstka, Stein (DoD C4ISR)
- [ ] "Understanding Information Age Warfare" — Alberts et al.
- [ ] "Command of the Commons" — Barry Posen
- [ ] RAND studies on sensor fusion and kill chains
- [ ] Real-world examples: Desert Storm, OIF, Ukraine 2022+
