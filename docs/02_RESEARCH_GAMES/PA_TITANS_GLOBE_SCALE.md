# Planetary Annihilation: Titans — Globe-Scale UI Analysis

> PA proves that spherical maps work for RTS. NEXUS adopts its zoom system and strategic iconography.

---

## The Globe Works

PA's central innovation: **the planet IS the map**.

No flat projection. No edge wrapping. A literal sphere you rotate, zoom, and fight across.

This proves:
- Players can navigate spherical space
- Strategic geography (choke points, distance) works on a sphere
- The tech is solvable (PA shipped, runs smoothly)

---

## Seamless Strategic Zoom

PA's zoom is continuous:

```
ORBITAL VIEW (see whole planet)
      ↓
CONTINENTAL VIEW (see major features)
      ↓
REGIONAL VIEW (see base layouts)
      ↓
TACTICAL VIEW (see individual units)
```

No loading screens. No separate "strategic map." One continuous zoom.

### How Icons Scale

| Zoom Level | Unit Representation |
|------------|---------------------|
| Orbital | Dots or nothing (too small) |
| Continental | Simplified strategic icons |
| Regional | Unit type icons with count badges |
| Tactical | Full 3D models |

The transition is smooth. Players don't notice the switch.

---

## NEXUS Adoption

### Five Zoom Tiers

| Tier | Altitude | Shows | NEXUS Equivalent |
|------|----------|-------|------------------|
| 1 | Orbital | Whole globe, theater overview | Theater command view |
| 2 | Continental | Region, major formations | Operational view |
| 3 | Regional | Swarm locations, coverage areas | Swarm management view |
| 4 | Tactical | Individual swarm composition | Tactical view |
| 5 | Detail | Single platform (optional) | Inspection view |

### Icon Abstraction Rules

**At strategic zoom (Tier 1-2):**
- Swarms = single NATO-style icon
- Icon shows: domain (air/ground/sea), role (recon/strike/EW), count
- Sensor coverage = colored overlay regions
- Contacts = threat symbols with confidence indicator

**At tactical zoom (Tier 4-5):**
- Individual platforms visible
- Sensor cones/arcs visible
- Contact uncertainty ellipses at actual size
- Formation structure visible

---

## Picture-in-Picture

PA pioneered PIP for multi-planet play:
- Main view: where you're working
- PIP: another location (different planet, different battle)

### NEXUS PIP Uses

1. **Multi-theater awareness** — Watch secondary theater while commanding primary
2. **Alert response** — PIP auto-switches to show new threats
3. **Pre-positioned view** — Keep PIP on known hotspot

Implementation:
- One PIP window (more = visual clutter)
- Player can pin PIP to location OR set to "alert mode" (shows newest threat)
- PIP has own zoom level independent of main view

---

## Globe as Strategic Terrain

PA's spherical map creates natural strategy:

- **Great circle routes:** Shortest path curves around the globe
- **Hemisphere awareness:** Can't see the other side without sensor coverage
- **Polar regions:** Different from equatorial (in NEXUS: Arctic mechanics)
- **Choke points:** Straits, mountain passes are natural barriers

NEXUS adds:
- **Sensor shadow:** The globe's curvature limits line-of-sight sensors
- **Satellite geometry:** LEO satellites follow orbital paths around the sphere
- **OTH radar:** Bounces off ionosphere, follows great circle paths

---

## Performance Lessons

PA handles thousands of units on a sphere. Key techniques:

1. **LOD (Level of Detail):** Far units are cheap to render
2. **Spatial partitioning:** Octree or similar for sphere
3. **Culling:** Don't process/render what's behind the planet
4. **Icon batching:** Strategic icons are GPU-cheap

NEXUS performance budget should follow similar principles:
- 10,000+ entities possible if LOD is aggressive
- Strategic zoom should be cheapest (fewer draw calls)
- Tactical zoom is expensive (limit visible units)

---

## What PA Lacks (NEXUS Opportunities)

### 1. Fog of War Depth
PA's fog of war is binary: visible or not.
NEXUS: Probabilistic detection with confidence states.

### 2. Sensor Differentiation
PA's "radar" is just vision with longer range.
NEXUS: Each sensor type is mechanically distinct.

### 3. Emission Economy
PA has no "your sensors reveal you" mechanic.
NEXUS: Core mechanic.

### 4. Time Control
PA is real-time only (multiplayer focus).
NEXUS: Full pause/speed control (single-player focus).

---

## Specific PA Features to Study

1. **Zoom transition smoothness** — Watch how icons morph into models
2. **Strategic icon language** — How unit types are communicated at distance
3. **Multi-planet PIP** — How attention is split without confusion
4. **Unit pathing on sphere** — How movement orders work on curved surface

---

## Summary

PA proves the globe-as-map concept works. NEXUS adopts:

| PA Feature | NEXUS Implementation |
|------------|---------------------|
| Seamless zoom | 5-tier continuous zoom |
| Strategic icons | NATO-style symbols at distance |
| PIP | Single alert-aware PIP |
| Spherical pathfinding | Great-circle movement |
| LOD system | Aggressive LOD for performance |
