# Combat Resolution System

> How engagements are resolved. Simple enough to predict, complex enough to be interesting.

---

## Design Intent

Combat in NEXUS is **consequential but not the focus**. The game is about finding targets and building the sensor picture. Once you've done that work, combat should be:
- Predictable (good sensor work = reliable kills)
- Quick (not drawn-out attrition battles)
- Satisfying (the kill chain payoff)

---

## The Kill Chain Recap

```
FIND → FIX → TRACK → TARGET → ENGAGE → ASSESS
        Sensor work              Combat work
        (80% of gameplay)        (20% of gameplay)
```

Combat is the PAYOFF for sensor work, not the main event.

---

## Engagement Requirements

### Minimum Confidence to Engage

| Aggression Parameter | Minimum Confidence |
|---------------------|-------------------|
| 0.0-0.3 (Low) | Identified (0.76+) |
| 0.4-0.6 (Medium) | Track (0.51+) |
| 0.7-1.0 (High) | Contact (0.26+) |

Higher aggression = willing to shoot at less-certain targets.

### Weapon-Target Matching

| Weapon Type | Valid Targets |
|-------------|---------------|
| Loitering munition (HORNET) | Ground, slow air, surface |
| Anti-ship missile | Surface ships only |
| Torpedo | Submarines, surface ships |
| Air-to-air | Air targets |
| SEAD/ARM | Emitting radar sites |

Attempting to engage invalid target type fails.

---

## Hit Probability

### Base Formula

```
hit_probability = weapon_accuracy × target_vulnerability × environment_modifier × guidance_quality
```

### Weapon Accuracy (Base Values)

| Weapon | Base Accuracy |
|--------|---------------|
| HORNET (loitering) | 0.85 |
| Precision missile | 0.90 |
| Anti-ship missile | 0.75 |
| Torpedo | 0.65 |
| ARM | 0.70 (if target emitting) |

### Target Vulnerability

Based on target size and countermeasures:

| Factor | Modifier |
|--------|----------|
| Large target (ship, building) | ×1.2 |
| Medium target (vehicle, aircraft) | ×1.0 |
| Small target (drone, small boat) | ×0.8 |
| Active countermeasures | ×0.6-0.8 |
| Maneuvering | ×0.7-0.9 |

### Environment Modifier

| Condition | Modifier |
|-----------|----------|
| Clear weather | ×1.0 |
| Rain/fog | ×0.9 |
| Storm | ×0.7 |
| Smoke/obscurant | ×0.8 |
| Target in terrain cover | ×0.6-0.8 |

### Guidance Quality

Based on sensor track quality at moment of engagement:

| Track Quality | Modifier |
|---------------|----------|
| Identified (0.76+) | ×1.0 |
| Track (0.51-0.75) | ×0.85 |
| Contact (0.26-0.50) | ×0.65 |
| Anomaly (0.01-0.25) | ×0.40 |

**Key insight:** Better sensor work = higher hit probability

---

## Damage Resolution

### Damage Types

| Type | Effective Against |
|------|------------------|
| Kinetic | Armor, structures |
| Blast | Soft targets, sensors |
| EMP | Electronics, networks |
| Fragmentation | Aircraft, exposed systems |

### Damage Formula

```
damage_dealt = weapon_damage × hit_location_modifier × armor_penetration
```

### Hit Location (Simplified)

| Roll | Location | Modifier |
|------|----------|----------|
| 1-60 | Center mass | ×1.0 |
| 61-80 | Systems | ×0.8 (but system damage) |
| 81-95 | Glancing | ×0.5 |
| 96-100 | Critical | ×2.0 |

### Armor System

```
effective_damage = max(0, damage - armor_value)
```

If damage < armor, no effect.
If damage > armor, excess damages HP.

---

## Health and Destruction

### Platform HP Ranges

| Category | HP Range |
|----------|----------|
| Small drone | 10-30 |
| Medium drone | 30-60 |
| Large platform | 60-150 |
| Ship | 200-500 |
| Fixed installation | 100-300 |

### Destruction States

| HP Remaining | Status |
|--------------|--------|
| >50% | Operational |
| 25-50% | Degraded (reduced capability) |
| 1-25% | Critical (may fail catastrophically) |
| 0 | Destroyed |

### Degraded Effects

When platform is degraded (25-50% HP):
- Sensor range: -25%
- Speed: -25%
- Random system failures possible

---

## Critical Hits

5% chance per hit to be critical. Critical hits:
1. Deal 2× damage
2. AND cause system damage

### System Damage Table

| Roll | System Damaged | Effect |
|------|----------------|--------|
| 1-20 | Propulsion | Speed reduced 50% |
| 21-40 | Sensors | One sensor type disabled |
| 41-60 | Communications | Cannot share data to network |
| 61-80 | Weapons | Cannot engage targets |
| 81-100 | Power | All systems at 50% effectiveness |

---

## Battle Damage Assessment (BDA)

After engagement, BDA determines if target was actually destroyed.

### BDA Requirements

- Sensor pass over target location
- Confidence rebuild to at least Track level
- Time delay (smoke/debris must clear)

### BDA Results

| Observation | Meaning |
|-------------|---------|
| No contact at expected location | Target destroyed OR moved |
| Contact, no emissions, no movement | Target destroyed (confirmed) |
| Contact, degraded signature | Target damaged |
| Contact, normal signature | Target survived (miss or armor) |

**Important:** Without BDA, you don't KNOW if you killed the target. Kill claims ≠ confirmed kills.

---

## Countermeasures

### Active Countermeasures

| System | Effect | Cost |
|--------|--------|------|
| Chaff | Degrades radar-guided weapons (-30% accuracy) | Expendable |
| Flares | Degrades IR-guided weapons (-40% accuracy) | Expendable |
| Decoys | May divert weapon entirely (30% chance) | Expendable |
| Hard-kill APS | Intercepts incoming (60% vs missiles) | Ammo-limited |

### Passive Countermeasures

| System | Effect |
|--------|--------|
| Stealth (low RCS) | Harder to track, guidance degrades faster |
| Maneuvering | Reduces hit probability |
| Terrain masking | Breaks guidance lock |

---

## Engagement Visualization

### During Engagement

1. Weapon launch indicated (icon leaves launching platform)
2. Weapon tracks toward target (trajectory line)
3. Impact moment (flash effect)
4. Outcome displayed (hit/miss/destroyed)

### Timeline View

Strike planning overlay shows:
- Weapon time-of-flight
- Expected impact time
- Multiple weapons deconflicted
- BDA window

---

## Fratricide Prevention

### IFF (Identify Friend or Foe)

All platforms have IFF. Before engaging:
1. IFF interrogation (brief emission)
2. Response confirms friendly OR no response = potentially hostile
3. System prevents engagement of IFF-confirmed friendlies

### ROE (Rules of Engagement) Override

If Aggression > 0.8 AND contact is only "Contact" level:
- Risk of fratricide exists
- Player warned before engagement
- Collateral damage possible

---

## Summary

Combat resolution:
1. **Simple probability roll** based on weapon + target + environment + guidance
2. **Damage against HP** reduced by armor
3. **Critical hits** cause system damage
4. **BDA required** to confirm kills
5. **Countermeasures** available to both sides

The better your sensor work, the more reliable your kills.
