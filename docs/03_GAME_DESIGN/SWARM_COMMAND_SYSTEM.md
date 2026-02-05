# Swarm Command System

> How the player controls autonomous swarms through behavioral parameters, not micromanagement.

---

## Design Intent

The player is a **swarm commander**, not a unit micro-manager. Instead of clicking individual drones, the player:
1. Sets behavioral parameters
2. Assigns objectives
3. Monitors execution
4. Intervenes when necessary

The swarm AI handles the details. The player handles strategy.

---

## Swarm Composition

### Swarm Structure

```
SWARM
├── Platform slots (4-16 depending on swarm type)
├── Behavioral parameters (5 sliders)
├── EMCON profile
├── Current objective
└── Approval queue (pending decisions)
```

### Platform Categories

| Category | Role | Example Platforms |
|----------|------|-------------------|
| **Recon** | Sensor coverage | SPECTER, WHISPER-R |
| **Strike** | Target engagement | HORNET, TALON |
| **EW** | Electronic warfare | WHISPER-J, PHANTOM |
| **Support** | Logistics, relay | ATLAS, MULE |
| **Multi-role** | Flexible composition | SPECTER (armed variant) |

### Composition Rules

- Minimum 4 platforms per swarm
- Maximum 16 platforms per swarm
- Mixed compositions allowed (recon + strike in same swarm)
- Composition affects swarm capabilities (can't strike without strike platforms)

---

## Behavioral Parameters

Five sliders control swarm behavior. Each ranges 0.0 to 1.0.

### 1. Autonomy

**Low (0.0-0.3):** Swarm asks permission for everything
- All engagements require approval
- Route changes require approval
- Sensor mode changes require approval

**Medium (0.4-0.6):** Swarm handles routine, asks for critical
- Routine navigation autonomous
- Contact investigation autonomous
- Engagements require approval

**High (0.7-1.0):** Swarm operates independently
- Full autonomous engagement within ROE
- Self-directed objective pursuit
- Player notified, not asked

### 2. Aggression

**Low (0.0-0.3):** Avoid engagement
- Prioritize survival
- Disengage when detected
- Never initiate unless ordered

**Medium (0.4-0.6):** Engage targets of opportunity
- Engage if advantage clear
- Disengage if outmatched
- Balance mission vs. targets

**High (0.7-1.0):** Seek engagement
- Actively hunt valid targets
- Accept higher risk
- Prioritize kills over mission completion

### 3. Dispersion

**Low (0.0-0.3):** Tight formation
- Platforms stay close
- Better mutual support
- Vulnerable to area weapons
- Concentrated sensor coverage

**High (0.7-1.0):** Wide spread
- Platforms spread across area
- Better area coverage
- Less mutual support
- Harder to destroy entire swarm

### 4. Persistence

**Low (0.0-0.3):** Abort easily
- Return at first sign of trouble
- Preserve platforms
- May fail objectives

**High (0.7-1.0):** Mission focus
- Continue despite losses
- Accept attrition
- Complete objectives at cost

### 5. Stealth

**Low (0.0-0.3):** EMCON normal/aggressive
- Use all sensors freely
- Faster detection
- Higher signature

**High (0.7-1.0):** EMCON strict/limited
- Passive sensors only
- Slower detection
- Lower signature

---

## Approval Queue

When Autonomy is below maximum, swarms request approval for decisions.

### Queue Item Structure

```
ApprovalRequest {
    swarm_id: SwarmId,
    request_type: RequestType,
    description: String,
    options: Vec<Option>,
    time_sensitive: bool,
    auto_resolve_time: f32,  // Seconds until AI decides if player doesn't
    recommended: OptionId,
}
```

### Request Types

| Type | Example | Urgency |
|------|---------|---------|
| ENGAGE | "HORNET-3 requests weapons free on Track 47" | High |
| ROUTE | "Threat detected. Reroute around SAM coverage?" | Medium |
| EMCON | "Enemy ELINT detected. Go EMCON strict?" | Medium |
| INVESTIGATE | "Anomaly detected. Divert to investigate?" | Low |
| ABORT | "Heavy losses. Abort mission?" | High |

### Queue UI

- Appears in left panel when items pending
- Color-coded by urgency
- Timer shows auto-resolve countdown
- Player can approve, deny, or modify

---

## Objective System

### Objective Types

| Type | Description | Completion Condition |
|------|-------------|---------------------|
| **PATROL** | Cover area with sensors | Time elapsed OR contact detected |
| **SEARCH** | Find specific target | Target identified |
| **TRACK** | Maintain custody of contact | Continuous track for duration |
| **STRIKE** | Destroy target | Target destroyed (BDA confirmed) |
| **ESCORT** | Protect friendly | Friendly survives mission |
| **SUPPRESS** | Degrade enemy capability | Enemy sensor/comms disabled |
| **RESUPPLY** | Deliver logistics | Payload delivered to FOB/swarm |

### Objective Priority

When swarms have multiple objectives:
1. Survival (unless Persistence maxed)
2. Primary objective
3. Secondary objectives
4. Targets of opportunity

---

## Swarm AI Behavior Hierarchy

Four-layer AI system (detailed in AI_BEHAVIOR_HIERARCHY.md):

```
ADAPTIVE (Learning)
    ↓
OPERATIONAL (Objective pursuit)
    ↓
TACTICAL (Formation, coordination)
    ↓
REACTIVE (Immediate threats)
```

Higher layers set goals. Lower layers handle execution.

---

## Swarm Creation

### During Campaign

- Player assigned pre-composed swarms per mission
- Some missions allow limited composition changes
- Later missions unlock swarm builder

### Swarm Builder (Post-Mission 10)

```
Swarm Builder UI:
├── Available platforms (limited by Manufacturing)
├── Swarm template selection (preset compositions)
├── Custom composition (drag platforms into slots)
├── Behavioral preset selection
└── Confirm / Cancel
```

### Template Examples

| Template | Composition | Best For |
|----------|-------------|----------|
| Recon Element | 4× SPECTER | Area surveillance |
| Strike Package | 4× SPECTER + 8× HORNET | Precision strike |
| Hunter-Killer | 6× SPECTER + 6× HORNET | Search and destroy |
| EW Support | 4× WHISPER + 4× SPECTER | Jamming coverage |
| Logistics | 4× ATLAS | Resupply operations |

---

## Player Commands

### Direct Commands (Always Available)

| Command | Effect |
|---------|--------|
| MOVE TO | Navigate to map location |
| HOLD POSITION | Stop and maintain position |
| RETURN TO BASE | Navigate to nearest FOB |
| ENGAGE TARGET | Attack specific contact |
| CANCEL ORDER | Abort current activity |

### Parameter Adjustment

All 5 behavioral parameters adjustable at any time via slider UI.

### EMCON Override

Player can force EMCON level regardless of Stealth parameter.

---

## Swarm Status Indicators

Visual indicators on globe and in swarm panel:

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green | Healthy, on mission |
| 🟡 Yellow | Low resources or minor issues |
| 🔴 Red | Under attack or critical |
| ⬜ White outline | Selected |
| 📡 Antenna icon | EMCON strict (passive only) |
| ⚡ Lightning icon | EMCON aggressive (all sensors) |
| ❓ Question mark | Awaiting approval |

---

## Network Integration

Swarms share data when networked:
- Contacts detected by one swarm visible to all
- Network degradation (jamming, distance) reduces sharing
- Isolated swarms operate on own sensors only

See SENSOR_FUSION_SYSTEM.md for network mechanics.
