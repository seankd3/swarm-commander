# VTOL VR — Sensor Feel Analysis

> VTOL VR makes radar modes FEEL different. NEXUS needs this tactile sensor interaction even in a god's-eye view.

---

## What VTOL VR Gets Right

### 1. Radar Modes Matter

In VTOL VR, switching radar modes isn't just a setting — it changes gameplay:

| Mode | What You See | What Enemy Sees |
|------|--------------|-----------------|
| **TWS** (Track While Scan) | Multiple contacts, less detail | "Search" on their RWR |
| **STT** (Single Target Track) | One contact, full detail, launch-ready | "LOCK" warning on their RWR |
| **SAR** (Synthetic Aperture) | Ground map, fixed targets | Ground ELINT detects you |
| **OFF** | Nothing | Nothing |

The enemy's RWR responds differently to each mode. TWS lets you observe without announcing intent. STT tells them "I'm about to shoot."

### 2. Datalink Visualization

VTOL VR distinguishes:
- **Solid symbols:** Your own sensor contacts
- **Hollow symbols:** Datalinked contacts from AWACS

This simple visual distinction shows:
- What you know yourself
- What you're being told by the network

When AWACS goes down, hollow symbols disappear. Suddenly you're alone.

### 3. RWR Audio Design

Different sounds for different threats:
- **Search ping:** Low priority, someone's looking
- **Track tone:** Higher priority, you're being tracked
- **Lock warning:** Urgent, spike sound, missile imminent
- **Launch warning:** Panic, different tone, evade NOW

Audio carries threat information without requiring visual attention.

### 4. The "Picture Building" Satisfaction

Starting with an empty scope and progressively:
1. Seeing first blips
2. Sorting contacts (hostile vs. neutral vs. friendly)
3. Classifying targets (fighter vs. bomber vs. civilian)
4. Achieving targeting solution

This progression is inherently satisfying. It's a puzzle you solve with sensors.

---

## NEXUS Adoption

### Radar Mode Distinction

NEXUS sensor modes should have gameplay consequences:

| NEXUS Mode | Behavior | Tradeoff |
|------------|----------|----------|
| **Passive Scan** | Lower power, longer dwell | Longer detection time, lower signature |
| **Active Scan** | Full power, fast update | Fast detection, high signature |
| **Track Mode** | Focused on specific contact | Maximum data on target, obvious intent |

### Own vs. Network Visualization

NEXUS must show:
- **Your swarm's sensors:** Solid contact icons
- **Network-shared data:** Different visual treatment (dimmer? outlined? different color?)

When a WHISPER EW platform jamming datalinks, network contacts should degrade/disappear while own-sensor contacts remain.

### Audio Feedback Layers

| Event | Audio | Priority |
|-------|-------|----------|
| New anomaly | Soft blip | Low |
| Contact upgrade (anomaly → contact) | Confirmation tone | Medium |
| Track achieved | Solid tone | Medium |
| Identification complete | Distinct chime | Medium-high |
| Threat detected (enemy sensor) | Warning tone | High |
| Under attack | Alarm | Critical |

Audio should be layered so players can hear threat level without reading UI.

### Sensor Interaction Feel

Even though NEXUS is god's-eye (not cockpit), sensor interaction should feel:
- **Responsive:** Mode changes have immediate visual feedback
- **Consequential:** Choices matter (EMCON decisions visible)
- **Satisfying:** Classification upgrades feel like achievements

---

## The "Sort" Fantasy

VTOL VR players talk about "sorting the picture" — the process of:
1. Multiple unknown contacts
2. Systematically interrogating each
3. Building mental model of battlespace
4. Achieving clarity from chaos

NEXUS must provide this same satisfaction at operational scale:
- Start of mission: fog of war, scattered anomalies
- Mid-mission: contacts building, pattern emerging
- Engagement: clear picture, confident decisions

---

## Cockpit vs. Command

VTOL VR is first-person cockpit. NEXUS is third-person command.

| VTOL VR (Cockpit) | NEXUS (Command) |
|-------------------|-----------------|
| One radar scope | Multiple sensor overlays |
| Manual mode switches | EMCON profiles per swarm |
| Physical immersion | Information immersion |
| Reflex-based evasion | Strategic positioning |

The FEELING should be similar even though the INTERFACE is different:
- Information scarcity → information gain
- Uncertainty → clarity
- Threat awareness → threat response

---

## Specific VTOL VR Mechanics to Study

1. **The F-45's radar scope** — How contacts appear, how modes switch
2. **AWACS datalink missions** — How networked picture differs from own sensors
3. **SAM site avoidance** — How RWR communicates threat geometry
4. **Multiplayer coordination** — How sensor data is shared between players

---

## Summary

VTOL VR proves that sensor gameplay can be viscerally satisfying even when the "action" is just staring at a radar scope. NEXUS must capture:

- Mode switching feels consequential
- Own sensors vs. network clearly distinct
- Audio carries threat information
- Building the picture is the reward
