# Learning Curve Design — From Tactical to Theater

## The Problem with Hearts of Iron

HOI4 drops you into a world simulation with 50+ interlocking systems and says "good luck." The wiki is essential. The tutorial barely covers the basics. New players don't fail because they're stupid — they fail because they don't know *what they don't know*. The game doesn't tell you that supply lines matter until your army starves. It doesn't teach you air doctrine until your divisions get bombed into oblivion.

**NEXUS solves this by making every mission a tutorial for the next mission's complexity.**

---

## The Scaling Ladder

The campaign is structured as a **complexity ladder** where each mission introduces exactly ONE new system while reinforcing everything learned before. The player starts commanding a single small swarm in a constrained tactical scenario and gradually scales up to full theater command.

### Tier 1: Tactical (Missions 1-5) — "Learn Your Sensors"

The player commands a **single swarm** (4-12 units) in small, contained scenarios. No economy. No tech tree. No politics. Just sensors and targets.

**Mission 1: "First Light"**
- **You have:** 4 SPECTER recon drones (passive EO/IR only)
- **Objective:** Find a stationary submarine in a defined 50km × 50km ocean area
- **Teaches:** Basic movement, camera/sensor controls, the concept of detection confidence (Anomaly → Contact → Track → Identified), and the satisfaction of building a picture from nothing
- **Complexity:** Zero combat. Zero emissions decisions. Just "fly here, look at things, find the sub"
- **Time:** ~10 minutes. All real-time, maybe 2x speed for transit.

**Mission 2: "Listening Post"**
- **You have:** 4 SPECTERs + 2 WHISPER ELINT platforms
- **Objective:** Detect and classify a convoy crossing through your sector
- **Teaches:** ELINT — detecting *other people's* radar emissions. The convoy has air defense radars that emit periodically. ELINT picks them up passively. Introduces the concept: "their emissions = your information."
- **New concept:** Passive vs active sensors. ELINT bearing-only contacts (you know the direction, not the distance).

**Mission 3: "The Sweep"**
- **You have:** 8 SPECTERs with radar + EO/IR
- **Objective:** Find and identify 3 mobile missile launchers hidden in forested terrain
- **Teaches:** Active radar — you can now emit. Your radar sees through weather but the enemy's RWR detects your emissions. First encounter with the emission tradeoff: going active reveals you. Introduces terrain effects (forest blocks EO/IR from above).
- **New concept:** The emission economy. First "oh shit" moment when the enemy reacts to your radar sweep.

**Mission 4: "Eyes and Ears"**
- **You have:** Mixed sensor swarm (radar + EO/IR + ELINT + acoustic)
- **Objective:** Build a complete picture of an enemy base's defenses without being detected
- **Teaches:** Sensor layering. Different sensors see different things. ELINT detects their radar. EO/IR identifies vehicle types. Acoustic detects generator noise. Radar fills gaps but risks detection. First mission where you MUST use multiple sensor types together.
- **New concept:** Sensor fusion — how different data sources combine into a complete operational picture.

**Mission 5: "First Strike"**
- **You have:** Recon swarm + HORNET strike swarm
- **Objective:** Find, identify, and destroy a specific target (mobile SAM launcher) in a defended area
- **Teaches:** The **complete kill chain** (F2T2EA). Find with ELINT, fix with radar, track with EO/IR, target with strike planning, engage with HORNETs, assess with post-strike overfly. First combat mission. Introduces combat resolution, damage model, and BDA (battle damage assessment).
- **New concept:** Sensor-to-shooter pipeline. The kill chain as gameplay.

### Tier 2: Operational (Missions 6-12) — "Command Multiple Swarms"

The player now commands **2-4 swarms simultaneously** in larger areas. Economy and resources appear. Behavioral parameters unlock. Weather and terrain become active factors.

**Mission 6: "Dual Front"**
- **You have:** 2 swarms (recon + strike)
- **Objective:** Simultaneously scout two approaches to an objective, choose which to attack
- **Teaches:** Managing attention between multiple swarms. The Autonomy slider — you can't micromanage both, so you must delegate. Introduces the approval queue.
- **New concept:** Autonomy parameter. Trusting your swarm AI vs maintaining control.

**Mission 7: "Weather Front"**
- **You have:** 3 swarms across a theater with an incoming storm
- **Objective:** Maintain sensor coverage as weather degrades your sensors
- **Teaches:** Weather effects on sensors. Storm degrades optical, partially degrades radar. Forces repositioning and sensor mode changes. Introduces the weather forecast overlay.
- **New concept:** Environmental effects on sensors. Dynamic conditions requiring adaptation.

**Mission 8: "Spectrum War"**
- **You have:** Recon + strike + WHISPER EW swarm
- **Objective:** Suppress enemy air defenses using EW, then strike
- **Teaches:** Electronic warfare — jamming enemy radar, spoofing contacts, the cost of jamming (you become a giant ELINT target). Counter-EW from the enemy.
- **New concept:** Full EW system. Jamming as both weapon and vulnerability.

**Mission 9: "Supply Lines"**
- **You have:** Multiple swarms + logistics assets
- **Objective:** Sustain a 12-hour patrol operation (first mission longer than 1 hour game-time)
- **Teaches:** Logistics and endurance. Swarms run out of fuel/ammo. ATLAS resupply drones. MULE ground logistics. Forward operating bases. Introduces the economy (manufacturing, logistics points).
- **New concept:** Resource economy. Sustainability. Time management (variable speed becomes essential).

**Mission 10-12: "Combined Arms"**
- Progressive missions combining all Tier 2 systems into increasingly complex scenarios
- Multi-domain operations (air + ground, or air + maritime)
- Enemy forces that actively adapt to your tactics
- Political capital appears (collateral restrictions)

### Tier 3: Theater (Missions 13-20+) — "Run the War"

Full theater command. Multiple simultaneous operations. Full economy. Tech tree. Strategic-level decisions. This is the "Hearts of Iron" experience, but the player already understands every system because they learned them one at a time.

**Mission 13: "Theater Command"**
- **You have:** Theater-level resources, FOBs, manufacturing, full platform roster
- **Objective:** Secure a contested island chain over 48 game-hours
- **Teaches:** Theater-level resource management. Choosing where to invest limited assets. Strategic vs tactical priorities.
- **New concept:** Theater-scale thinking. Grand strategy layer.

**Missions 14-20+:** Escalating theater scenarios across different global theaters (Taiwan Strait, Arctic, Baltic, Horn of Africa), each emphasizing different systems and challenging the player in new ways.

---

## Progressive Disclosure Rules

### UI Unlocking

Not all UI panels are visible from Mission 1. They unlock as the player learns the relevant system:

| Mission | UI Element Unlocked |
|---------|-------------------|
| 1 | Globe, basic sensor overlay, detection confidence display |
| 2 | ELINT bearing lines, passive sensor indicators |
| 3 | Radar emission warnings (RWR), emission toggle controls |
| 4 | Sensor fusion panel, multi-sensor track correlation display |
| 5 | Strike planning overlay, kill chain timeline, BDA panel |
| 6 | Swarm manager (left panel), autonomy slider, approval queue |
| 7 | Weather overlay, forecast panel, environmental effects display |
| 8 | EW control panel, jammer controls, spectrum display |
| 9 | Economy panel, logistics routes, FOB management |
| 10+ | Full UI — all panels available, customizable layout |

### Tooltip System

Every UI element has a contextual tooltip that explains:
1. **What it is** (1 sentence)
2. **Why it matters** (1 sentence about gameplay impact)
3. **How to use it** (1 sentence action description)

Tooltips are always available but don't interrupt gameplay. Optional "advisor" voice callouts for first encounters with new systems.

### Complexity Budget per Mission

Each mission has a strict **complexity budget**:
- **1 new system** introduced per mission (never 2+)
- **All previous systems** remain active (reinforcement)
- **Scenario designed** so the new system is the key to success (you can't win mission 3 without using radar)
- **Failure is informative** — when you fail, the game tells you WHY (e.g., "Your recon swarm was detected because active radar revealed its position. Try using passive sensors to approach undetected.")

### Advisor System

An AI advisor (in-fiction: your XO) provides contextual guidance:
- **Proactive:** "Commander, weather is degrading sensor coverage in Sector 7. Consider redeploying the SPECTER swarm." (Only appears when relevant, not constant chatter)
- **Reactive:** When the player makes a suboptimal choice, the advisor gently suggests alternatives: "Active radar will reveal our position. Want me to switch to passive mode?"
- **Dismissable:** Players can reduce or disable advisor frequency from settings
- **Scales with experience:** Advisor talks less as the player demonstrates competence (tracked by successful mission completions and system usage)

---

## The "Aha!" Moments

Each tier is designed to produce specific insight moments:

### Tier 1 Aha! Moments
- "Oh, my radar can see them but they can see me looking!" (Mission 3)
- "I need different sensors for different jobs" (Mission 4)
- "Finding the target IS the hard part — killing it is easy" (Mission 5)

### Tier 2 Aha! Moments
- "I can't watch everything — I need to trust the AI for some things" (Mission 6)
- "Weather just ruined my whole plan — I need to think about environment" (Mission 7)
- "Jamming made me invisible to radar but lit me up on ELINT" (Mission 8)
- "My swarms can't stay deployed forever — logistics matters" (Mission 9)

### Tier 3 Aha! Moments
- "I won by never firing a shot — my sensor net saw everything and they couldn't see me" (information superiority victory)
- "I lost because I had firepower but no intelligence — I was swinging blind" (fog of war defeat)
- "The weather window was the real weapon — the storm was my ally" (environmental exploitation)

---

## Post-Campaign: Sandbox & Replayability

After completing the campaign, players have:
1. **Unlocked all systems and UI elements**
2. **Understood every mechanic through hands-on experience**
3. **Access to Sandbox mode** with full scenario editor
4. **Access to all campaign theaters** for replay at higher difficulty
5. **Custom scenario sharing** with other players

The campaign is ~15-20 hours. Sandbox and replays provide unlimited replayability. Community-created scenarios extend content indefinitely.

---

## Comparison: HOI4 vs NEXUS Learning Experience

| Aspect | HOI4 | NEXUS |
|--------|------|-------|
| First 30 minutes | Overwhelmed by 50+ systems | Commanding 4 drones, finding a submarine |
| Learns by | Wiki, YouTube, trial and error | Playing the game |
| Failure feedback | Cryptic (why did my army collapse?) | Explicit (your radar revealed your position) |
| UI complexity | Everything visible immediately | Progressive unlock matching knowledge |
| Time to competence | 50-100 hours | 10-15 hours (through campaign) |
| Time to mastery | 500+ hours | 200+ hours (theater-level expertise) |
| Onboarding dropout | Very high (majority never finish tutorial) | Low (Mission 1 is immediately satisfying) |
