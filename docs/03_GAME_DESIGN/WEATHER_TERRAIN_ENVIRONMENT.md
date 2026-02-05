# Weather, Terrain, and Environment System

> Environmental factors that affect sensor performance, movement, and gameplay. Simple individually, emergent together.

---

## Design Intent

Environment should:
1. Create tactical variety (same units, different conditions = different gameplay)
2. Reward planning (check weather before mission)
3. Enable emergent situations (storm + enemy EMCON = surprise)
4. Be understandable (clear cause-effect relationships)

---

## Weather System

### Weather States

| State | Description | Probability |
|-------|-------------|-------------|
| Clear | No weather effects | 40% |
| Partly Cloudy | Minor cloud cover | 20% |
| Overcast | Full cloud cover | 15% |
| Rain (light) | Precipitation | 10% |
| Rain (heavy) | Significant precipitation | 7% |
| Fog | Low visibility | 5% |
| Storm | Severe weather | 3% |

### Weather Effects Matrix

| Sensor Type | Clear | Cloudy | Rain | Fog | Storm |
|-------------|-------|--------|------|-----|-------|
| Radar | 100% | 100% | 90% | 100% | 70% |
| EO (visual) | 100% | 90% | 70% | 20% | 30% |
| IR | 100% | 95% | 75% | 70% | 50% |
| ELINT | 100% | 100% | 100% | 100% | 90% |
| Acoustic | 100% | 100% | 80% | 100% | 60% |
| Satellite EO | 100% | 50% | 0% | 0% | 0% |
| Satellite SAR | 100% | 100% | 80% | 100% | 60% |

**Key insight:** Radar and ELINT are all-weather. EO/IR are weather-dependent. This creates the tradeoff: go active (radar) in bad weather or accept reduced capability.

### Weather Transitions

Weather changes over time:
```
current_weather → transition (30-60 min) → new_weather
```

Transition visible via weather overlay:
- Current conditions
- Forecast (next 6-12 hours)
- Certainty decreases with time

### Special Weather Events

| Event | Effect | Duration |
|-------|--------|----------|
| Tropical storm | All sensors degraded, movement restricted | 2-6 hours |
| Arctic fog | EO near-zero, enhanced thermal contrast | 1-3 hours |
| Sand/dust storm | All sensors degraded, EW enhanced | 1-4 hours |
| Aurora | OTH radar offline, comms degraded | Variable |

---

## Terrain System

### Terrain Types

| Type | Ground Movement | Air LOS | Ground LOS |
|------|-----------------|---------|------------|
| Ocean | Ships only | Clear | Clear |
| Plains | 100% | Clear | Clear |
| Hills | 80% | Clear | Partial block |
| Forest | 60% | EO blocked from above | Blocked |
| Mountains | 40% | Clear | Blocked (valleys only) |
| Urban | 70% | Partial (buildings) | Blocked (streets) |
| Desert | 90% | Clear | Clear |
| Arctic | 70% | Clear | Clear |
| Jungle | 40% | Blocked | Blocked |
| Swamp | 30% | Partial | Partial |

### Terrain Effects on Sensors

**Line of Sight (LOS):**
- Mountains block radar LOS for targets behind them
- Creates "radar shadows" — blind spots
- Radar horizon calculation includes terrain height

**Ground Clutter:**
- Urban/forest/mountains create radar returns
- Reduces effective detection range for ground targets
- GMTI mode filters moving targets, loses stationary ones

**Acoustic Terrain:**
- Mountains reflect sound (echoes, false contacts)
- Ocean: thermocline layers bend sonar
- Urban: ambient noise degrades acoustic sensors

### Terrain as Tactical Element

**Masking:**
- Aircraft can fly "terrain masked" (nap-of-earth)
- Hidden from radar until they pop up
- Movement speed penalty (-50%)

**Ambush positions:**
- Valleys are sensor traps (limited coverage, blocked escape)
- Ridge lines provide sensor advantage

---

## Day/Night Cycle

### Time of Day

24-hour cycle with:
- Dawn: 0600 (varies by latitude/season)
- Day: 0600-1800
- Dusk: 1800
- Night: 1800-0600

### Night Effects

| Factor | Day | Night |
|--------|-----|-------|
| EO (visual) | 100% | 10% (without NVG) |
| EO (with NVG) | N/A | 60% |
| IR | 100% | 120% (better thermal contrast) |
| Movement detection | Easier | Harder |
| Visual identification | Easy | Difficult |

**Night operations:**
- Favor IR sensors over EO
- Identification harder (need closer range)
- Ambush effectiveness increased

---

## Theater-Specific Environments

### Pacific/Maritime

- Vast open water (good radar, no terrain cover)
- Thermocline layers (submarine hide/seek)
- Typhoon season (major weather events)
- Long distances (logistics challenge)

### Arctic

- Ice coverage varies by season
- Extreme cold (-30°C): electronics degraded
- Polar day/night (24h light or dark)
- Aurora disruption (comms/radar)
- Submarines can hide under ice

### Baltic/European

- Dense terrain (forests, urban)
- Short engagement distances
- Heavy clutter (civilian traffic)
- Four-season weather variation

### Desert/Middle East

- Clear weather (mostly)
- Sand storms (periodic)
- Extreme heat: IR signature reduction (hot background)
- Long LOS (flat terrain)

---

## Environmental Interaction Matrix

| Environment Factor | Affects |
|-------------------|---------|
| Weather → Sensors | Range, accuracy, availability |
| Weather → Movement | Speed, availability |
| Weather → Weapons | Accuracy, guidance |
| Terrain → Sensors | LOS, clutter, coverage |
| Terrain → Movement | Speed, route options |
| Terrain → Weapons | Delivery angles, masking |
| Time → Sensors | EO/IR effectiveness |
| Time → Detection | Visual identification |

---

## Player Information

### Weather Overlay

Toggle shows:
- Current conditions per region
- Forecast timeline
- Sensor degradation indicators

### Terrain Analysis

Toggle shows:
- Elevation shading
- LOS from selected point
- Movement speed overlay
- Sensor coverage accounting for terrain

### Environmental Advisories

System alerts:
- "Storm approaching Sector 5 — ETA 2 hours"
- "Night operations begin in 45 minutes"
- "Arctic conditions: electronic reliability at 80%"

---

## Emergent Scenarios

The system enables situations like:

**"The Perfect Storm"**
- Arctic fog rolls in
- EO/IR near-useless
- Player must go radar-active
- Enemy was waiting with ELINT under EMCON
- Ambush

**"Night Raid"**
- Player attacks at night
- Enemy EO surveillance blind
- Player uses IR for approach
- Strike succeeds, low detection

**"Weather Window"**
- Storm blocks enemy satellite pass
- Player repositions during storm
- Storm clears, player in new position
- Enemy's sensor picture is obsolete

These scenarios aren't scripted — they emerge from system interactions.

---

## Implementation Notes

### Weather Generation

- Per-region weather state
- Markov chain transitions (current → next probabilities)
- Theater-specific probability distributions
- Forecast = current + transition probabilities shown

### Terrain Data

- Height map per theater (from real data, abstracted)
- Terrain type overlay
- Pre-computed LOS caches for performance

### Performance

- Weather effects: simple multipliers (cheap)
- Terrain LOS: pre-computed, cached
- Movement costs: lookup table
