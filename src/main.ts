import 'maplibre-gl/dist/maplibre-gl.css';
import { createInitialState } from './simulation/state';
import { tick } from './simulation/game';
import { setSpeed, togglePause } from './simulation/time';
import type { GameState, TimeSpeed, EntityId, Entity, Position, Task, TaskParams } from './simulation/types';
import { TASK_DEFAULTS, KNOT_TO_MS } from './simulation/types';
import { getPlatform } from './platforms/platform-registry';
import { createCamera, resizeCamera, syncCamera, worldToScreen, screenToWorld } from './renderer/camera';
import type { Camera } from './renderer/camera';
import { render, type RenderOptions } from './renderer/canvas-renderer';
import { createInputState, bindInputEvents } from './input/input-handler';
import { initPlatforms } from './platforms/init';
import { initScenarios } from './scenarios/init';
import { getAllScenarios, getScenario } from './scenarios/scenario-registry';
import { resetEntityCounter } from './simulation/entity-factory';
import { initMap, destroyMap, hasMap } from './renderer/map-instance';

import type { ScenarioDef, IntelBriefing } from './scenarios/scenario-types';
import maplibregl from 'maplibre-gl';

// Planner imports
import { createInitialPlannerState } from './planning/mission-planner-types';
import type { PlannerState } from './planning/mission-planner-types';
import {
  getAvailableMissionTypesForEntities,
  resetPlanner,
  quickLaunch,
} from './planning/planner-state';
import { MISSION_TYPES } from './planning/mission-types';

// --- Initialization ---

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas(): void {
  // When intel dashboard is open, canvas only covers the right portion
  const intelW = intelDashboardOpen ? 300 : 0;
  const w = window.innerWidth - intelW;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera = resizeCamera(camera, w, h);
}

// Initialize registries early
initPlatforms();
initScenarios();

// State
let gameState: GameState = createInitialState('opening-strike');
let camera: Camera = createCamera(window.innerWidth, window.innerHeight);
let missionActive = false;

// Planner state
let plannerState: PlannerState = createInitialPlannerState();
let plannerOpen = false;
let queuePanelOpen = false;
let plannerTargetMode = false; // waiting for map click to set AO target
let plannerWaypointMode: 'ingress' | 'egress' | null = null; // waiting for map click to set waypoint
let mouseScreenPos: { x: number; y: number } | null = null;
let taskCounter = 0;
let activeScenarioIntel: import('./scenarios/scenario-types').IntelMarker[] = [];

// --- Hit Testing ---

const CLICK_RADIUS = 15; // pixels

function findEntityAtScreen(screenX: number, screenY: number): Entity | null {
  let closest: Entity | null = null;
  let closestDist = CLICK_RADIUS;

  for (const entity of gameState.entities.values()) {
    if (entity.state === 'DESTROYED') continue;
    if (entity.faction === 'RED' && !entity.isDetected) continue;
    const screen = worldToScreen(camera, entity.position);
    const dx = screenX - screen.x;
    const dy = screenY - screen.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = entity;
    }
  }
  return closest;
}

function findBlueEntitiesInBox(x1: number, y1: number, x2: number, y2: number): EntityId[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const ids: EntityId[] = [];

  for (const entity of gameState.entities.values()) {
    if (entity.state === 'DESTROYED' || entity.faction !== 'BLUE') continue;
    const screen = worldToScreen(camera, entity.position);
    if (screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY) {
      ids.push(entity.id);
    }
  }
  return ids;
}

// --- Selection Helpers ---

function setSelection(ids: Set<EntityId>): void {
  gameState = {
    ...gameState,
    selection: { ...gameState.selection, selectedIds: ids },
  };
}

// --- Move Command (right-click / shift+right-click) ---

function createMoveToTask(entityIds: EntityId[], destination: Position, append: boolean): void {
  if (entityIds.length === 0) return;

  const id = `task-${++taskCounter}`;
  const now = gameState.time.elapsed;
  const params: TaskParams = { ...TASK_DEFAULTS.MOVE_TO };

  const task: Task = {
    id,
    type: 'MOVE_TO',
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'ARRIVAL' },
    createdAt: now,
    activatedAt: null,
    params,
    destination,
  };

  const entities = new Map(gameState.entities);
  const tasks = [...gameState.tasks, task];

  for (const eid of entityIds) {
    const entity = entities.get(eid);
    if (!entity) continue;

    if (append) {
      // Shift+right-click: append to end of queue
      entities.set(eid, {
        ...entity,
        taskQueue: [...entity.taskQueue, id],
      });
    } else {
      // Normal right-click: replace queue entirely
      // Clear existing move tasks for this entity
      entities.set(eid, {
        ...entity,
        currentTaskId: id,
        taskQueue: [],
      });
      // Activate immediately
      (task as any).status = 'ACTIVE';
      (task as any).activatedAt = now;
    }
  }

  gameState = { ...gameState, entities, tasks };
}

// --- Input ---

const inputState = createInputState({
  onLeftClick: (screenX, screenY, ctrlKey) => {
    if (gameState.missionResult !== 'PENDING') return;

    // Planner target mode: click to set target
    if (plannerTargetMode) {
      const worldPos = screenToWorld(camera, screenX, screenY);
      plannerState = { ...plannerState, step: 3 as 3, targetPosition: worldPos };
      plannerTargetMode = false;
      updateCursor();
      renderPlannerPanel();
      return;
    }

    // Planner waypoint mode: click to set ingress/egress
    if (plannerWaypointMode) {
      const worldPos = screenToWorld(camera, screenX, screenY);
      if (plannerWaypointMode === 'ingress') {
        plannerState = { ...plannerState, ingressPoint: worldPos };
      } else {
        plannerState = { ...plannerState, egressPoint: worldPos };
      }
      plannerWaypointMode = null;
      updateCursor();
      renderPlannerPanel();
      return;
    }

    const entity = findEntityAtScreen(screenX, screenY);

    if (entity && entity.faction === 'BLUE') {
      if (ctrlKey) {
        const newSet = new Set(gameState.selection.selectedIds);
        if (newSet.has(entity.id)) {
          newSet.delete(entity.id);
        } else {
          newSet.add(entity.id);
        }
        setSelection(newSet);
      } else {
        setSelection(new Set([entity.id]));
      }
    } else if (!ctrlKey) {
      setSelection(new Set());
    }
  },

  onBoxSelect: (startX, startY, endX, endY, ctrlKey) => {
    if (gameState.missionResult !== 'PENDING') return;

    const ids = findBlueEntitiesInBox(startX, startY, endX, endY);
    if (ctrlKey) {
      const newSet = new Set(gameState.selection.selectedIds);
      for (const id of ids) newSet.add(id);
      setSelection(newSet);
    } else {
      setSelection(new Set(ids));
    }
  },

  onRightClick: (screenX, screenY, shiftKey) => {
    if (gameState.missionResult !== 'PENDING') return;

    // Cancel planner target/waypoint mode on right click
    if (plannerTargetMode || plannerWaypointMode) {
      plannerTargetMode = false;
      plannerWaypointMode = null;
      updateCursor();
      return;
    }

    const selectedIds = Array.from(gameState.selection.selectedIds);
    if (selectedIds.length === 0) return;

    const worldPos = screenToWorld(camera, screenX, screenY);
    createMoveToTask(selectedIds, worldPos, shiftKey);
  },

  onSelectionBoxUpdate: (startX, startY, endX, endY) => {
    gameState = {
      ...gameState,
      selection: {
        ...gameState.selection,
        boxStart: { x: startX, y: startY },
        boxEnd: { x: endX, y: endY },
      },
    };
  },

  onSelectionBoxClear: () => {
    gameState = {
      ...gameState,
      selection: {
        ...gameState.selection,
        boxStart: null,
        boxEnd: null,
      },
    };
  },
});

bindInputEvents(canvas, inputState);

// Track mouse position for placement preview (canvas-relative)
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseScreenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
});
canvas.addEventListener('mouseleave', () => {
  mouseScreenPos = null;
});

function updateCursor(): void {
  canvas.style.cursor = (plannerTargetMode || plannerWaypointMode) ? 'crosshair' : 'default';
}

// --- HUD Elements ---

const blueCountEl = document.getElementById('blue-count')!;
const redCountEl = document.getElementById('red-count')!;
const plannerModeEl = document.getElementById('planner-mode-indicator')!;
const unitInfoPanel = document.getElementById('unit-info-panel')!;
const unitInfoContent = document.getElementById('unit-info-content')!;

const btnPause = document.getElementById('btn-pause')!;
const btn1x = document.getElementById('btn-1x')!;
const btn5x = document.getElementById('btn-5x')!;
const btn20x = document.getElementById('btn-20x')!;

// Intel dashboard elements
const intelDashboard = document.getElementById('intel-dashboard')!;
const intelObjectivesEl = document.getElementById('intel-objectives')!;
const intelStatsEl = document.getElementById('intel-stats')!;
const intelThreatsEl = document.getElementById('intel-threats')!;
const intelFeedEl = document.getElementById('intel-feed')!;

// Planner panel elements
const plannerPanel = document.getElementById('planner-panel')!;
const btnPlanner = document.getElementById('btn-planner')!;
const plannerClose = document.getElementById('planner-close')!;
const plannerContent = document.getElementById('planner-content')!;

// Queue panel elements
const queuePanel = document.getElementById('queue-panel')!;
const btnQueue = document.getElementById('btn-queue')!;
const queueClose = document.getElementById('queue-close')!;
const queueContent = document.getElementById('queue-content')!;

// Intel dashboard is always visible during gameplay (no toggle state needed)
let intelDashboardOpen = false;

// Copy event log button
document.getElementById('copy-events-btn')?.addEventListener('click', () => {
  const events = [...gameState.events].reverse();
  const lines = events.map(evt => {
    const ts = formatGameTime(evt.timestamp);
    return `${ts}\t${evt.category}\t${evt.message}`;
  });
  const header = `SWARM COMMANDER — Event Log (${events.length} events)\n${'='.repeat(50)}`;
  const text = header + '\n' + lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-events-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    }
  });
});

// Planner panel toggle
btnPlanner.addEventListener('click', () => {
  plannerOpen = !plannerOpen;
  plannerPanel.classList.toggle('visible', plannerOpen);
  if (plannerOpen) {
    queuePanelOpen = false;
    queuePanel.classList.remove('visible');
    plannerState = resetPlanner();
    renderPlannerPanel();
  }
});
plannerClose.addEventListener('click', () => {
  plannerOpen = false;
  plannerPanel.classList.remove('visible');
  plannerTargetMode = false;
  plannerWaypointMode = null;
  updateCursor();
});

// Queue panel toggle
btnQueue.addEventListener('click', () => {
  queuePanelOpen = !queuePanelOpen;
  queuePanel.classList.toggle('visible', queuePanelOpen);
  if (queuePanelOpen) {
    plannerOpen = false;
    plannerPanel.classList.remove('visible');
    renderQueuePanel();
  }
});
queueClose.addEventListener('click', () => {
  queuePanelOpen = false;
  queuePanel.classList.remove('visible');
});

// ===== PLANNER RENDERING =====

function renderPlannerPanel(): void {
  switch (plannerState.step) {
    case 1: renderStep1(); break;
    case 2: renderStep2(); break;
    case 3: renderStep3(); break;
  }
}

// --- Step 1: Pick Mission Type ---

function renderStep1(): void {
  const selectedIds = Array.from(gameState.selection.selectedIds);
  const available = getAvailableMissionTypesForEntities(selectedIds, gameState);

  let html = '<div class="planner-section"><div class="planner-section-label">SELECT MISSION</div>';

  if (selectedIds.length === 0) {
    html += '<div style="color:#5F6B7C;font-size:10px;padding:8px 0">Select units on the map first</div>';
  }

  for (const m of available) {
    const cls = m.available ? 'mission-type-card' : 'mission-type-card locked';
    html += `<div class="${cls}" data-mission-id="${m.def.id}" style="margin-bottom:4px">
      <div class="mission-type-name">${m.def.shortName}</div>
      <div class="mission-type-desc">${m.def.description}</div>
      ${m.missingHint ? `<div class="mission-type-hint">${m.missingHint}</div>` : ''}
    </div>`;
  }

  html += `<div style="color:#5F6B7C;font-size:10px;padding:4px 0">${selectedIds.length} unit${selectedIds.length !== 1 ? 's' : ''} selected</div>`;
  html += '</div>';

  plannerContent.innerHTML = html;

  // Wire mission type cards
  plannerContent.querySelectorAll<HTMLElement>('.mission-type-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const missionId = card.dataset.missionId!;
      const mt = available.find(m => m.def.id === missionId);
      if (mt && mt.available) {
        plannerState = { ...plannerState, step: 2 as 2, selectedMissionType: mt.def.id };
        plannerTargetMode = true;
        updateCursor();
        renderPlannerPanel();
      }
    });
  });
}

// --- Step 2: Click Target ---

function renderStep2(): void {
  if (!plannerState.selectedMissionType) return;
  const mtDef = MISSION_TYPES.find(m => m.id === plannerState.selectedMissionType);

  let html = `<div class="planner-section">
    <div class="planner-section-label">${mtDef?.shortName ?? 'MISSION'}</div>
    <div class="target-prompt">CLICK MAP TO SET TARGET</div>
  </div>`;

  html += `<div class="planner-nav">
    <button class="planner-nav-btn" id="planner-back">&larr; BACK</button>
    <span></span>
  </div>`;

  plannerContent.innerHTML = html;

  document.getElementById('planner-back')?.addEventListener('click', () => {
    plannerTargetMode = false;
    updateCursor();
    plannerState = { ...plannerState, step: 1 as 1, selectedMissionType: null, targetPosition: null };
    renderPlannerPanel();
  });
}

// --- Step 3: Confirm Target + Waypoints + Launch ---

function renderStep3(): void {
  if (!plannerState.selectedMissionType || !plannerState.targetPosition) return;
  const mtDef = MISSION_TYPES.find(m => m.id === plannerState.selectedMissionType);
  const tgt = plannerState.targetPosition;
  const ing = plannerState.ingressPoint;
  const egr = plannerState.egressPoint;

  let html = `<div class="planner-section">
    <div class="planner-section-label">${mtDef?.shortName ?? 'MISSION'}</div>
    <div style="color:#8F99A8;font-size:10px">Target: ${tgt.lat.toFixed(3)}N ${tgt.lon.toFixed(3)}E</div>
  </div>`;

  // Waypoints
  html += '<div class="planner-section"><div class="planner-section-label">WAYPOINTS (optional)</div>';
  html += `<div class="param-row">
    <span class="param-label">IN</span>
    <div class="param-btns">
      <button class="param-btn${ing ? ' selected' : ''}" id="set-ingress-btn" style="flex:2">${ing ? `${ing.lat.toFixed(2)}N ${ing.lon.toFixed(2)}E` : 'Click map...'}</button>
      ${ing ? '<button class="param-btn" id="clear-ingress-btn" style="flex:0;width:24px">X</button>' : ''}
    </div>
  </div>`;
  html += `<div class="param-row">
    <span class="param-label">OUT</span>
    <div class="param-btns">
      <button class="param-btn${egr ? ' selected' : ''}" id="set-egress-btn" style="flex:2">${egr ? `${egr.lat.toFixed(2)}N ${egr.lon.toFixed(2)}E` : 'Click map...'}</button>
      ${egr ? '<button class="param-btn" id="clear-egress-btn" style="flex:0;width:24px">X</button>' : ''}
    </div>
  </div>`;
  html += '</div>';

  // Nav
  html += `<div class="planner-nav">
    <button class="planner-nav-btn" id="planner-back">&larr; BACK</button>
    <button class="planner-nav-btn launch" id="planner-launch">LAUNCH</button>
  </div>`;

  plannerContent.innerHTML = html;

  // Wire waypoint buttons
  document.getElementById('set-ingress-btn')?.addEventListener('click', () => {
    plannerWaypointMode = 'ingress';
    updateCursor();
  });
  document.getElementById('set-egress-btn')?.addEventListener('click', () => {
    plannerWaypointMode = 'egress';
    updateCursor();
  });
  document.getElementById('clear-ingress-btn')?.addEventListener('click', () => {
    plannerState = { ...plannerState, ingressPoint: null };
    renderStep3();
  });
  document.getElementById('clear-egress-btn')?.addEventListener('click', () => {
    plannerState = { ...plannerState, egressPoint: null };
    renderStep3();
  });

  // Wire back
  document.getElementById('planner-back')?.addEventListener('click', () => {
    plannerState = { ...plannerState, step: 2 as 2, targetPosition: null };
    plannerTargetMode = true;
    updateCursor();
    renderPlannerPanel();
  });

  // Wire launch
  document.getElementById('planner-launch')?.addEventListener('click', () => {
    executeLaunch();
  });
}

// --- Launch ---

function showLaunchError(msg: string): void {
  const existing = plannerContent.querySelector('.launch-error');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'launch-error';
  div.textContent = msg;
  div.style.cssText = 'color:#E76A6E;font-size:10px;text-align:center;padding:4px 0;font-weight:600;';
  plannerContent.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function executeLaunch(): void {
  if (!plannerState.targetPosition || !plannerState.selectedMissionType) {
    showLaunchError('Missing target or mission type');
    return;
  }

  const selectedIds = Array.from(gameState.selection.selectedIds);
  if (selectedIds.length === 0) {
    showLaunchError('No units selected');
    return;
  }

  const result = quickLaunch(
    selectedIds,
    plannerState.selectedMissionType,
    plannerState.targetPosition,
    plannerState.ingressPoint,
    plannerState.egressPoint,
    gameState,
  );

  if (!result) {
    showLaunchError('Launch failed — check unit capabilities');
    return;
  }

  // Apply tasks to game state
  const entities = new Map(gameState.entities);
  for (const [eid, updates] of result.entityUpdates) {
    const entity = entities.get(eid);
    if (entity) {
      entities.set(eid, { ...entity, ...updates });
    }
  }

  gameState = {
    ...gameState,
    entities,
    tasks: [...gameState.tasks, ...result.tasks],
  };

  // Auto-start if paused
  if (gameState.time.speed === 0) {
    gameState = {
      ...gameState,
      time: { ...gameState.time, speed: 1, previousSpeed: 1 },
    };
  }

  // Reset planner
  plannerState = resetPlanner();
  plannerOpen = false;
  plannerPanel.classList.remove('visible');
  plannerTargetMode = false;
  plannerWaypointMode = null;
  updateCursor();

  // Open queue panel to show the executing tasks
  queuePanelOpen = true;
  queuePanel.classList.add('visible');
  renderQueuePanel();
}

// ===== INTEL DASHBOARD =====

function formatGameTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const EVENT_ICONS: Record<string, string> = {
  DETECTION: '\u25C9',   // ◉
  ENGAGEMENT: '\u2694',  // ⚔
  DESTRUCTION: '\u2717', // ✗
  MISSION: '\u2713',     // ✓
  FUEL: '\u26A0',        // ⚠
  AMMO: '\u25CF',        // ●
};

function renderIntelDashboard(): void {
  const { entities, objectives, time, events, contacts } = gameState;

  // --- Header clock ---
  const headerEl = intelDashboard.querySelector('.intel-header span');
  if (headerEl) {
    // Show mission elapsed time as a UTC-style clock (starting from 06:00 UTC as a fictional start)
    const missionStartHour = 6;
    const totalSeconds = Math.floor(time.elapsed);
    const hours = missionStartHour + Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const utcStr = `${(hours % 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}Z`;
    headerEl.textContent = `INTEL  ${utcStr}`;
  }

  // --- Objectives ---
  let objHtml = '<div class="intel-section-header">MISSION OBJECTIVES</div><div class="intel-section-body">';
  for (const obj of objectives) {
    let done = false;
    for (const entity of entities.values()) {
      if (entity.tag === obj.entityTag && entity.state === 'DESTROYED') {
        done = true;
        break;
      }
    }
    objHtml += `<div class="intel-obj-row">
      <span class="intel-obj-check ${done ? 'done' : 'pending'}">${done ? 'X' : ''}</span>
      <span class="intel-obj-label ${done ? 'done' : ''}">${obj.label}</span>
    </div>`;
  }
  const completedObjs = objectives.filter(o => {
    for (const e of entities.values()) {
      if (e.tag === o.entityTag && e.state === 'DESTROYED') return true;
    }
    return false;
  }).length;
  objHtml += `<div style="color:#5F6B7C;font-size:9px;margin-top:4px">${completedObjs}/${objectives.length} complete &middot; ${formatGameTime(time.elapsed)} elapsed</div>`;
  objHtml += '</div>';
  intelObjectivesEl.innerHTML = objHtml;

  // --- Force Stats ---
  let blueAlive = 0, blueTotal = 0, blueAirborne = 0;
  let redDetected = 0, redDestroyed = 0;
  let missilesInFlight = gameState.missiles.length;

  for (const entity of entities.values()) {
    if (entity.faction === 'BLUE') {
      blueTotal++;
      if (entity.state !== 'DESTROYED') {
        blueAlive++;
        if (entity.flightState === 'AIRBORNE') blueAirborne++;
      }
    } else {
      if (entity.state === 'DESTROYED') redDestroyed++;
      if (entity.isDetected && entity.state !== 'DESTROYED') redDetected++;
    }
  }

  let statsHtml = '<div class="intel-section-header">FORCE STATUS</div><div class="intel-section-body">';
  statsHtml += '<div class="intel-stats">';
  statsHtml += `<div class="intel-stat"><div class="intel-stat-value blue">${blueAirborne}</div><div class="intel-stat-label">AIRBORNE</div></div>`;
  statsHtml += `<div class="intel-stat"><div class="intel-stat-value amber">${redDetected}</div><div class="intel-stat-label">CONTACTS</div></div>`;
  statsHtml += `<div class="intel-stat"><div class="intel-stat-value red">${redDestroyed}</div><div class="intel-stat-label">KILLS</div></div>`;
  statsHtml += '</div>';
  statsHtml += `<div style="display:flex;justify-content:space-between;color:#5F6B7C;font-size:9px;margin-top:4px">
    <span>BLUE: ${blueAlive}/${blueTotal}</span>
    <span>MISSILES: ${missilesInFlight}</span>
  </div>`;
  statsHtml += '</div>';
  intelStatsEl.innerHTML = statsHtml;

  // --- Threat Summary ---
  let threatHtml = '<div class="intel-section-header">DETECTED THREATS</div><div class="intel-section-body">';
  let threatCount = 0;
  for (const contact of contacts.values()) {
    if (contact.faction !== 'RED') continue;
    const entity = entities.get(contact.entityId);
    const isAlive = entity && entity.state !== 'DESTROYED';
    const platId = contact.entityType;
    const platName = platId ? getPlatform(platId).name : 'Unknown';

    let iconClass = 'other';
    if (platId && (platId.includes('SAM') || platId.includes('SA_') || platId.includes('TOR_') || platId.includes('S300'))) iconClass = 'sam';
    else if (platId && (platId.includes('RADAR') || platId.includes('EW'))) iconClass = 'radar';

    threatHtml += `<div class="intel-threat-row">
      <span class="intel-threat-icon ${iconClass}"></span>
      <span class="intel-threat-label">${platName}</span>
      <span class="intel-threat-status ${isAlive ? 'active' : 'destroyed'}">${isAlive ? (contact.isLive ? 'TRACKED' : 'STALE') : 'KILLED'}</span>
    </div>`;
    threatCount++;
  }
  if (threatCount === 0) {
    threatHtml += '<div style="color:#5F6B7C;font-size:10px">No contacts detected</div>';
  }
  threatHtml += '</div>';
  intelThreatsEl.innerHTML = threatHtml;

  // --- Event Feed ---
  let feedHtml = '';
  // Show most recent events first, limit to 50
  const recentEvents = [...events].reverse().slice(0, 50);
  for (const evt of recentEvents) {
    const icon = EVENT_ICONS[evt.category] ?? '\u25CF';
    const iconClass = evt.category.toLowerCase();
    feedHtml += `<div class="intel-event">
      <span class="intel-event-time">${formatGameTime(evt.timestamp)}</span>
      <span class="intel-event-icon ${iconClass}">${icon}</span>
      <span class="intel-event-msg">${evt.message}</span>
    </div>`;
  }
  if (recentEvents.length === 0) {
    feedHtml = '<div style="padding:8px 12px;color:#5F6B7C;font-size:10px">No events yet</div>';
  }
  intelFeedEl.innerHTML = feedHtml;
}

// --- Event Generation (tracks state changes and emits events) ---

let prevDestroyedIds = new Set<EntityId>();
let prevDetectedContacts = new Set<string>();
let prevBingoIds = new Set<EntityId>();
let prevFlightStates = new Map<EntityId, string>();
let prevTaskIds = new Map<EntityId, string | null>();
let prevAmmoStates = new Map<EntityId, number>();
let eventCounter = 0;

/** Friendly task type label for event messages, weapon-aware */
function taskTypeLabel(type: string, entity?: Entity): string {
  switch (type) {
    case 'MOVE_TO': return 'transiting to waypoint';
    case 'RECON_AREA': return 'reconning area';
    case 'PATROL': return 'on patrol';
    case 'STRIKE_ON_DETECT': {
      if (entity) {
        const plat = getPlatform(entity.platformId);
        if (plat.weapon?.type === 'CRUISE_MISSILE') return 'standoff — weapons free, awaiting COP contacts';
        if (plat.weapon?.type === 'ANTI_RADIATION') return 'SEAD — hunting radar emitters';
      }
      return 'weapons free, hunting';
    }
    case 'STRIKE_TARGET': return 'engaging target';
    case 'TAKEOFF': return 'launching';
    case 'LAND': return 'landing';
    case 'RTB': return 'returning to base';
    case 'FIRE_CRUISE_MISSILE': return 'standoff — firing Barracuda';
    case 'FIRE_ARM': return 'SEAD — firing ARM';
    case 'REARM': return 'rearming';
    case 'ORBIT': return 'holding pattern';
    default: return type.toLowerCase();
  }
}

function generateGameEvents(): void {
  const { entities, contacts, time, tasks } = gameState;
  const newEvents = [...gameState.events];

  // Build task lookup
  const taskById = new Map<string, typeof tasks[number]>();
  for (const t of tasks) taskById.set(t.id, t);

  for (const entity of entities.values()) {
    if (entity.faction !== 'BLUE') continue;
    const plat = getPlatform(entity.platformId);
    const label = `${plat.label} ${entity.id.slice(-4)}`;

    // Track destructions
    if (entity.state === 'DESTROYED' && !prevDestroyedIds.has(entity.id)) {
      prevDestroyedIds.add(entity.id);
      newEvents.push({
        id: `evt-${++eventCounter}`,
        timestamp: time.elapsed,
        category: 'DESTRUCTION',
        message: `BLUE ${plat.name} destroyed`,
        entityId: entity.id,
        position: entity.position,
      });
    }

    // Track flight state changes (takeoff, airborne, landing, parked)
    const prevFS = prevFlightStates.get(entity.id);
    if (prevFS && prevFS !== entity.flightState) {
      if (entity.flightState === 'LAUNCHING') {
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION', message: `${label} taking off`, entityId: entity.id,
        });
      } else if (entity.flightState === 'AIRBORNE' && prevFS === 'LAUNCHING') {
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION', message: `${label} airborne`, entityId: entity.id,
        });
      } else if (entity.flightState === 'RECOVERING') {
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION', message: `${label} on approach to land`, entityId: entity.id,
        });
      } else if (entity.flightState === 'PARKED' && prevFS === 'RECOVERING') {
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION', message: `${label} landed and parked`, entityId: entity.id,
        });
      }
    }
    prevFlightStates.set(entity.id, entity.flightState);

    // Track task transitions (new task started)
    const prevTid = prevTaskIds.get(entity.id);
    if (entity.currentTaskId && entity.currentTaskId !== prevTid) {
      const task = taskById.get(entity.currentTaskId);
      if (task) {
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION',
          message: `${label} — ${taskTypeLabel(task.type, entity)}`,
          entityId: entity.id,
        });
      }
    } else if (!entity.currentTaskId && prevTid && entity.flightState === 'AIRBORNE' && entity.taskQueue.length === 0) {
      // No more tasks — holding
      newEvents.push({
        id: `evt-${++eventCounter}`, timestamp: time.elapsed,
        category: 'MISSION',
        message: `${label} mission complete — holding`,
        entityId: entity.id,
      });
    }
    prevTaskIds.set(entity.id, entity.currentTaskId);

    // Track weapon fires (ammo decrease)
    if (entity.ammoState) {
      const prevAmmo = prevAmmoStates.get(entity.id);
      if (prevAmmo !== undefined && entity.ammoState.remaining < prevAmmo) {
        const plat = getPlatform(entity.platformId);
        const weaponName = plat.weapon?.type === 'CRUISE_MISSILE' ? 'Barracuda' :
                           plat.weapon?.type === 'ANTI_RADIATION' ? 'ARM' : 'weapon';
        newEvents.push({
          id: `evt-${++eventCounter}`, timestamp: time.elapsed,
          category: 'MISSION',
          message: `${label} FIRED ${weaponName} (${entity.ammoState.remaining}/${entity.ammoState.capacity} remaining)`,
          entityId: entity.id,
        });
      }
      prevAmmoStates.set(entity.id, entity.ammoState.remaining);
    }

    // Bingo fuel
    if (entity.fuelState?.isBingo && !prevBingoIds.has(entity.id)) {
      prevBingoIds.add(entity.id);
      newEvents.push({
        id: `evt-${++eventCounter}`,
        timestamp: time.elapsed,
        category: 'FUEL',
        message: `${label} BINGO FUEL`,
        entityId: entity.id,
      });
    }
  }

  // RED destructions
  for (const entity of entities.values()) {
    if (entity.faction !== 'RED') continue;
    if (entity.state === 'DESTROYED' && !prevDestroyedIds.has(entity.id)) {
      prevDestroyedIds.add(entity.id);
      const plat = getPlatform(entity.platformId);
      newEvents.push({
        id: `evt-${++eventCounter}`,
        timestamp: time.elapsed,
        category: 'DESTRUCTION',
        message: `RED ${plat.name} destroyed`,
        entityId: entity.id,
        position: entity.position,
      });
    }
  }

  // New contact detections
  for (const [cid, contact] of contacts) {
    if (!prevDetectedContacts.has(cid)) {
      prevDetectedContacts.add(cid);
      const platName = contact.entityType ? getPlatform(contact.entityType).name : 'Unknown';
      newEvents.push({
        id: `evt-${++eventCounter}`,
        timestamp: time.elapsed,
        category: 'DETECTION',
        message: `New contact: ${platName}`,
        entityId: contact.entityId,
        position: contact.position,
      });
    }
  }

  if (newEvents.length !== gameState.events.length) {
    gameState = { ...gameState, events: newEvents };
  }
}

// ===== QUEUE PANEL =====

function renderQueuePanel(): void {
  const selIds = Array.from(gameState.selection.selectedIds);

  if (selIds.length === 0) {
    queueContent.innerHTML = '<div style="padding:8px 10px;color:#5F6B7C;font-size:10px">Select units to view their task queue</div>';
    return;
  }

  // Show queue for first selected entity (or merged if multiple)
  let html = '';
  for (const eid of selIds.slice(0, 3)) {
    const entity = gameState.entities.get(eid);
    if (!entity || entity.state === 'DESTROYED') continue;

    const plat = getPlatform(entity.platformId);
    html += `<div style="padding:4px 10px;color:#C5CBD3;font-weight:600;font-size:10px;border-bottom:1px solid #2F343C">${plat.label} ${entity.id.slice(-4)}</div>`;

    // Current task
    const currentTask = entity.currentTaskId ? gameState.tasks.find(t => t.id === entity.currentTaskId) : null;
    if (currentTask) {
      const label = currentTask.type.replace(/_/g, ' ');
      html += `<div class="queue-item">
        <span class="queue-item-number">&gt;</span>
        <span class="queue-item-type">${label}</span>
        <span class="queue-item-status active">${currentTask.status}</span>
      </div>`;
    }

    // Queued tasks
    for (let i = 0; i < entity.taskQueue.length; i++) {
      const task = gameState.tasks.find(t => t.id === entity.taskQueue[i]);
      if (!task) continue;
      const label = task.type.replace(/_/g, ' ');
      html += `<div class="queue-item">
        <span class="queue-item-number">${i + 1}</span>
        <span class="queue-item-type">${label}</span>
        <span class="queue-item-status queued">QUEUED</span>
      </div>`;
    }

    if (!currentTask && entity.taskQueue.length === 0) {
      html += '<div style="padding:4px 10px;color:#5F6B7C;font-size:9px">No tasks</div>';
    }
  }

  if (selIds.length > 3) {
    html += `<div style="padding:4px 10px;color:#5F6B7C;font-size:9px">+${selIds.length - 3} more units...</div>`;
  }

  queueContent.innerHTML = html;
}

// ===== UNIT INFO PANEL =====

function formatRange(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(0)}km` : `${meters}m`;
}

function updateUnitInfoPanel(): void {
  const { entities, selection } = gameState;
  const selIds = Array.from(selection.selectedIds);
  const alive = selIds.map((id) => entities.get(id)).filter((e): e is Entity => !!e && e.state !== 'DESTROYED');

  if (alive.length === 0) {
    unitInfoPanel.classList.remove('visible');
    return;
  }

  unitInfoPanel.classList.add('visible');

  if (alive.length === 1) {
    const e = alive[0];
    const speedKts = Math.round(e.velocity.speed / KNOT_TO_MS);
    const maxKts = Math.round(e.maxSpeed / KNOT_TO_MS);
    const hpPct = Math.round((e.health / e.maxHealth) * 100);
    const hpClass = hpPct > 60 ? 'blue' : hpPct > 30 ? 'amber' : 'red';
    const stateClass = e.state.toLowerCase();

    let html = `<div class="unit-info-header"><span>${getPlatform(e.platformId).name}</span><span class="unit-state ${stateClass}">${e.state}</span></div>`;
    html += '<div class="unit-info-body">';
    html += `<div class="unit-stat-row"><span class="unit-stat-label">HP</span><span class="unit-stat-value ${hpClass}">${e.health}/${e.maxHealth} (${hpPct}%)</span></div>`;
    html += `<div class="unit-stat-row"><span class="unit-stat-label">Speed</span><span class="unit-stat-value">${speedKts} / ${maxKts} kts</span></div>`;
    html += `<div class="unit-stat-row"><span class="unit-stat-label">Heading</span><span class="unit-stat-value">${Math.round(e.heading)}\u00b0</span></div>`;
    html += `<div class="unit-stat-row"><span class="unit-stat-label">Position</span><span class="unit-stat-value">${e.position.lat.toFixed(3)}N ${e.position.lon.toFixed(3)}E</span></div>`;

    if (e.flightState !== 'GROUNDED') {
      const flightColor = e.flightState === 'AIRBORNE' ? 'blue' : e.flightState === 'PARKED' ? 'green' : 'amber';
      const flightStyle = flightColor === 'green' ? 'color: #32A467' : '';
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Flight</span><span class="unit-stat-value ${flightColor}" ${flightStyle ? `style="${flightStyle}"` : ''}>${e.flightState}</span></div>`;
    }
    if (e.fuelState) {
      const fuelPct = Math.round((e.fuelState.remaining / e.fuelState.capacity) * 100);
      const fuelColor = e.fuelState.isBingo ? (fuelPct < 10 ? 'red' : 'amber') : 'blue';
      const barWidth = 10;
      const filledBars = Math.round((fuelPct / 100) * barWidth);
      const fuelBar = '='.repeat(filledBars) + '-'.repeat(barWidth - filledBars);
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Fuel</span><span class="unit-stat-value ${fuelColor}">${fuelPct}% [${fuelBar}]${e.fuelState.isBingo ? ' BINGO' : ''}</span></div>`;
    }

    if (e.baseState) {
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Parked</span><span class="unit-stat-value">${e.baseState.parkedAircraft.length} aircraft</span></div>`;
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Queue</span><span class="unit-stat-value">${e.baseState.launchQueue.length} waiting</span></div>`;
    }

    html += '<div class="unit-info-divider"></div>';

    const platform = getPlatform(e.platformId);
    const colorTag = e.faction === 'BLUE' ? 'blue' : 'red';

    if (platform.sensor) {
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Sensor</span><span class="unit-stat-value ${colorTag}">${platform.sensor.displayName}</span></div>`;
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Range</span><span class="unit-stat-value">${formatRange(platform.sensor.range)}</span></div>`;
      html += `<div class="unit-stat-row"><span class="unit-stat-label">FOV</span><span class="unit-stat-value">${platform.sensor.fieldOfView}\u00b0${platform.sensor.rotationSpeed > 0 ? ' beam' : ''}</span></div>`;
      if (platform.sensor.rotationSpeed > 0) {
        html += `<div class="unit-stat-row"><span class="unit-stat-label">Scan Rate</span><span class="unit-stat-value">${platform.sensor.rotationSpeed}\u00b0/s</span></div>`;
      }
    }

    if (platform.weapon) {
      const weaponColor = e.faction === 'BLUE' ? 'amber' : 'red';
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Weapon</span><span class="unit-stat-value ${weaponColor}">${platform.weapon.displayName}</span></div>`;
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Range</span><span class="unit-stat-value">${formatRange(platform.weapon.range)}</span></div>`;
      if (platform.weapon.missileSpeed) {
        html += `<div class="unit-stat-row"><span class="unit-stat-label">Missile Spd</span><span class="unit-stat-value">${platform.weapon.missileSpeed} m/s</span></div>`;
      }
      if (platform.weapon.reloadTime > 0) {
        html += `<div class="unit-stat-row"><span class="unit-stat-label">Reload</span><span class="unit-stat-value">${platform.weapon.reloadTime}s</span></div>`;
      }
    }

    html += `<div class="unit-stat-row"><span class="unit-stat-label">Role</span><span class="unit-stat-value">${platform.description}</span></div>`;

    if (e.sensor && e.faction === 'BLUE') {
      html += '<div class="unit-info-divider"></div>';
      const radarColor = e.radarMode === 'ACTIVE' ? 'blue' : 'green';
      const radarLabel = e.radarMode === 'ACTIVE' ? 'ACTIVE' : 'PASSIVE (RWR)';
      html += `<div class="unit-stat-row"><span class="unit-stat-label">Radar</span><span class="unit-stat-value" style="color: ${radarColor === 'green' ? '#32A467' : '#4C90F0'}">${radarLabel}</span></div>`;
      if (e.detectedBy.length > 0) {
        html += `<div class="unit-stat-row"><span class="unit-stat-label">RWR</span><span class="unit-stat-value amber">THREAT DETECTED</span></div>`;
      }
    }

    // Task assignment (current + queue)
    const currentTask = e.currentTaskId ? gameState.tasks.find((t) => t.id === e.currentTaskId) : null;
    if (currentTask || e.taskQueue.length > 0) {
      html += '<div class="unit-info-divider"></div>';
      if (currentTask) {
        html += `<div class="unit-stat-row"><span class="unit-stat-label">Task</span><span class="unit-stat-value blue">${currentTask.type.replace(/_/g, ' ')}</span></div>`;
      }
      if (e.taskQueue.length > 0) {
        const queuedNames = e.taskQueue.slice(0, 3).map(tid => {
          const t = gameState.tasks.find(tk => tk.id === tid);
          return t ? t.type.replace(/_/g, ' ') : '?';
        }).join(' \u2192 ');
        const moreCount = e.taskQueue.length > 3 ? ` +${e.taskQueue.length - 3}` : '';
        html += `<div class="unit-stat-row"><span class="unit-stat-label">Queue</span><span class="unit-stat-value">${queuedNames}${moreCount}</span></div>`;
      }
    }

    html += '</div>';
    unitInfoContent.innerHTML = html;
  } else {
    // Multi-selection summary
    const typeCounts = new Map<string, { count: number; alive: number }>();
    let totalHp = 0;
    let totalMaxHp = 0;

    for (const e of alive) {
      const entry = typeCounts.get(e.platformId) || { count: 0, alive: 0 };
      entry.count++;
      if (e.state !== 'DESTROYED') entry.alive++;
      typeCounts.set(e.platformId, entry);
      totalHp += e.health;
      totalMaxHp += e.maxHealth;
    }

    const hpPct = Math.round((totalHp / totalMaxHp) * 100);
    const hpClass = hpPct > 60 ? 'blue' : hpPct > 30 ? 'amber' : 'red';

    let html = `<div class="unit-info-header"><span>${alive.length} UNITS SELECTED</span><span class="unit-stat-value ${hpClass}">${hpPct}% HP</span></div>`;
    html += '<div class="unit-info-multi">';

    for (const [type, info] of typeCounts) {
      const plat = getPlatform(type);
      const maxKts = plat.movement ? Math.round(plat.movement.maxSpeed / KNOT_TO_MS) : 0;
      html += `<div class="unit-info-multi-row"><span class="unit-type-label">${plat.label}</span><span class="unit-type-count">${info.alive}x</span></div>`;
      html += `<div class="unit-info-multi-row"><span class="unit-stat-label" style="padding-left:8px">${plat.name}</span><span class="unit-stat-value">${maxKts > 0 ? maxKts + ' kts max' : 'Static'}</span></div>`;
    }

    html += '</div>';
    unitInfoContent.innerHTML = html;
  }
}

// ===== HUD UPDATE =====

function updateHUD(): void {
  const { time, entities } = gameState;

  let blueAlive = 0;
  let blueTotal = 0;
  let redDetected = 0;
  for (const entity of entities.values()) {
    if (entity.faction === 'BLUE') {
      blueTotal++;
      if (entity.state !== 'DESTROYED') blueAlive++;
    } else {
      if (entity.isDetected && entity.state !== 'DESTROYED') redDetected++;
    }
  }

  blueCountEl.textContent = `${blueAlive}/${blueTotal}`;
  redCountEl.textContent = `${redDetected} CONTACT${redDetected !== 1 ? 'S' : ''}`;

  // Mode indicators
  if (plannerWaypointMode) {
    plannerModeEl.textContent = `SET ${plannerWaypointMode.toUpperCase()}`;
    plannerModeEl.style.display = 'inline';
  } else if (plannerTargetMode) {
    plannerModeEl.textContent = 'SET TARGET';
    plannerModeEl.style.display = 'inline';
  } else {
    plannerModeEl.style.display = 'none';
  }

  // Time controls
  btnPause.classList.toggle('active', time.speed === 0);
  btn1x.classList.toggle('active', time.speed === 1);
  btn5x.classList.toggle('active', time.speed === 5);
  btn20x.classList.toggle('active', time.speed === 20);

  updateUnitInfoPanel();

  // Update queue panel if visible
  if (queuePanelOpen) renderQueuePanel();
}

// --- Time Controls ---

function setGameSpeed(speed: TimeSpeed): void {
  gameState = { ...gameState, time: setSpeed(gameState.time, speed) };
}

btnPause.addEventListener('click', () => {
  gameState = { ...gameState, time: togglePause(gameState.time) };
});
btn1x.addEventListener('click', () => setGameSpeed(1));
btn5x.addEventListener('click', () => setGameSpeed(5));
btn20x.addEventListener('click', () => setGameSpeed(20));

// --- Keyboard Shortcuts ---

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      gameState = { ...gameState, time: togglePause(gameState.time) };
      break;
    case 'Digit1':
      setGameSpeed(1);
      break;
    case 'Digit2':
      setGameSpeed(5);
      break;
    case 'Digit3':
      setGameSpeed(20);
      break;
    case 'KeyT':
      plannerOpen = !plannerOpen;
      plannerPanel.classList.toggle('visible', plannerOpen);
      if (plannerOpen) {
        queuePanelOpen = false;
        queuePanel.classList.remove('visible');
        renderPlannerPanel();
      }
      break;
    case 'KeyQ':
      queuePanelOpen = !queuePanelOpen;
      queuePanel.classList.toggle('visible', queuePanelOpen);
      if (queuePanelOpen) {
        plannerOpen = false;
        plannerPanel.classList.remove('visible');
        renderQueuePanel();
      }
      break;
    case 'Escape':
      if (plannerTargetMode || plannerWaypointMode) {
        plannerTargetMode = false;
        plannerWaypointMode = null;
        updateCursor();
      } else if (plannerOpen) {
        plannerOpen = false;
        plannerPanel.classList.remove('visible');
        plannerTargetMode = false;
        updateCursor();
      } else if (queuePanelOpen) {
        queuePanelOpen = false;
        queuePanel.classList.remove('visible');
      } else {
        setSelection(new Set());
      }
      break;
  }
});

// --- Game Loop ---

let lastTimestamp = 0;

function gameLoop(timestamp: number): void {
  if (!missionActive) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const realDelta = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const cappedDelta = Math.min(realDelta, 0.1);

  gameState = tick(gameState, cappedDelta);

  // Sync camera from MapLibre state each frame
  if (hasMap()) {
    const intelW = intelDashboardOpen ? 300 : 0;
    camera = syncCamera(window.innerWidth - intelW, window.innerHeight);
  }

  // Generate events from state changes
  generateGameEvents();

  const renderOptions: RenderOptions = {
    taskPlacementMode: plannerTargetMode,
    mouseScreenPos,
    // Planner overlay: show AO and waypoints when planner is open
    plannerTarget: plannerOpen ? plannerState.targetPosition : null,
    plannerRadius: 20000,
    plannerIngress: plannerOpen ? plannerState.ingressPoint : null,
    plannerEgress: plannerOpen ? plannerState.egressPoint : null,
    // Intel markers from briefing
    intelMarkers: activeScenarioIntel,
  };
  render(ctx, gameState, camera, renderOptions);
  updateHUD();

  // Update intel dashboard (always visible during gameplay)
  if (intelDashboardOpen) renderIntelDashboard();

  requestAnimationFrame(gameLoop);
}

// ===== MISSION BRIEFING =====

const briefingEl = document.getElementById('mission-briefing')!;
const briefingTextContent = document.getElementById('briefing-text-content')!;
const briefingCanvas = document.getElementById('briefing-canvas') as HTMLCanvasElement;
const briefingBackBtn = document.getElementById('briefing-back')!;
const briefingBeginBtn = document.getElementById('briefing-begin')!;

let pendingScenarioId: string | null = null;
let pendingScenarioName: string | null = null;
let briefingMap: maplibregl.Map | null = null;

function showBriefing(scenario: ScenarioDef): void {
  if (!scenario.intel) {
    // No intel data — skip briefing, go straight to game
    launchScenario(scenario.id, scenario.name);
    return;
  }

  pendingScenarioId = scenario.id;
  pendingScenarioName = scenario.name;

  missionSelectEl.classList.add('hidden');
  briefingEl.classList.add('visible');

  renderBriefingText(scenario, scenario.intel);

  // Initialize real MapLibre map for the briefing, wait for load, then draw overlays
  requestAnimationFrame(() => {
    initBriefingMap(scenario);
  });
}

function hideBriefing(): void {
  briefingEl.classList.remove('visible');
  if (briefingMap) {
    briefingMap.remove();
    briefingMap = null;
  }
  pendingScenarioId = null;
  pendingScenarioName = null;
}

function initBriefingMap(scenario: ScenarioDef): void {
  if (briefingMap) {
    briefingMap.remove();
    briefingMap = null;
  }

  const container = document.getElementById('briefing-map')!;

  briefingMap = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
          tileSize: 256,
        },
      },
      layers: [{
        id: 'carto-dark-layer',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 19,
      }],
    },
    center: [scenario.mapCenter.lon, scenario.mapCenter.lat],
    zoom: scenario.mapZoom,
    attributionControl: false,
    dragRotate: false,
    interactive: true,
  });

  briefingMap.on('load', () => {
    if (scenario.intel) {
      renderBriefingOverlay(scenario, scenario.intel);
    }
  });

  // Re-draw on every frame during pan/zoom so overlay tracks the map
  briefingMap.on('move', () => {
    if (scenario.intel) {
      renderBriefingOverlay(scenario, scenario.intel);
    }
  });
}

briefingBackBtn.addEventListener('click', () => {
  hideBriefing();
  showMissionSelect();
});

briefingBeginBtn.addEventListener('click', () => {
  if (!pendingScenarioId || !pendingScenarioName) return;
  const id = pendingScenarioId;
  const name = pendingScenarioName;
  hideBriefing();
  launchScenario(id, name);
});

function renderBriefingText(scenario: ScenarioDef, intel: IntelBriefing): void {
  const threatLevel = intel.threatAssessment.split('.')[0].trim();
  const threatClass = threatLevel.toLowerCase().includes('high') ? 'high'
    : threatLevel.toLowerCase().includes('moderate') ? 'moderate' : 'low';

  let html = '';

  // Title bar
  html += `<div class="briefing-title-bar">
    <div class="briefing-title">${scenario.name.toUpperCase()}</div>
    <span class="briefing-classification">TOP SECRET // NOFORN</span>
  </div>`;

  // SITUATION
  html += `<div class="opord-section">
    <div class="opord-section-label">1. SITUATION</div>
    <div class="opord-text">${intel.situation}</div>
  </div>`;

  // MISSION
  html += `<div class="opord-section">
    <div class="opord-section-label">2. MISSION</div>
    <div class="opord-text">${intel.mission}</div>
  </div>`;

  // THREAT ASSESSMENT
  html += `<div class="opord-section">
    <div class="opord-section-label">3. THREAT ASSESSMENT <span class="threat-badge ${threatClass}">${threatLevel}</span></div>
    <div class="opord-text">${intel.threatAssessment}</div>
  </div>`;

  // ENEMY FORCES
  html += `<div class="opord-section">
    <div class="opord-section-label">4. ENEMY FORCES</div>
    <table class="force-table">
      <thead><tr><th>TYPE</th><th>COUNT</th><th>CAPABILITY</th></tr></thead>
      <tbody>`;

  for (const ef of intel.enemyForces) {
    html += `<tr>
      <td><span class="force-type">${ef.type}</span>${ef.notes ? `<br><span class="force-notes">${ef.notes}</span>` : ''}</td>
      <td><span class="force-count">${ef.count}</span></td>
      <td><span class="force-cap">${ef.capability}</span></td>
    </tr>`;
  }

  html += `</tbody></table></div>`;

  // FRIENDLY FORCES
  html += `<div class="opord-section">
    <div class="opord-section-label">5. FRIENDLY FORCES</div>
    <table class="force-table">
      <thead><tr><th>TYPE</th><th>QTY</th><th>ROLE</th></tr></thead>
      <tbody>`;

  for (const ff of intel.friendlyForces) {
    html += `<tr>
      <td><span class="friendly-type">${ff.type}</span></td>
      <td><span class="force-count">${ff.count}x</span></td>
      <td><span class="friendly-role">${ff.role}</span></td>
    </tr>`;
  }

  html += `</tbody></table></div>`;

  // APPROACH CORRIDORS
  if (intel.corridors.length > 0) {
    html += `<div class="opord-section">
      <div class="opord-section-label">6. APPROACH CORRIDORS</div>`;
    for (const c of intel.corridors) {
      html += `<div class="corridor-item">
        <div class="corridor-name">${c.name}</div>
        <div class="corridor-notes">${c.notes}</div>
      </div>`;
    }
    html += `</div>`;
  }

  // UNCONFIRMED REPORTS
  if (intel.unconfirmedReports.length > 0) {
    html += `<div class="opord-section">
      <div class="opord-section-label">7. UNCONFIRMED REPORTS</div>`;
    for (const report of intel.unconfirmedReports) {
      html += `<div class="report-item">${report}</div>`;
    }
    html += `</div>`;
  }

  briefingTextContent.innerHTML = html;
  briefingTextContent.scrollTop = 0;
}

/** Draw intel overlays on the briefing canvas using the live briefing map projection */
function renderBriefingOverlay(scenario: ScenarioDef, intel: IntelBriefing): void {
  if (!briefingMap) return;

  const mapCanvas = briefingCanvas;
  const container = mapCanvas.parentElement!;
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mapCanvas.width = rect.width * dpr;
  mapCanvas.height = rect.height * dpr;
  mapCanvas.style.width = `${rect.width}px`;
  mapCanvas.style.height = `${rect.height}px`;

  const mctx = mapCanvas.getContext('2d')!;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.clearRect(0, 0, rect.width, rect.height);

  const map = briefingMap;

  function toScreen(pos: Position): { x: number; y: number } {
    const p = map.project([pos.lon, pos.lat]);
    return { x: p.x, y: p.y };
  }

  function metersToPixels(meters: number, lat: number): number {
    const metersPerDeg = 111320 * Math.cos(lat * Math.PI / 180);
    const degSpan = meters / metersPerDeg;
    const p1 = map.project([0, lat]);
    const p2 = map.project([degSpan, lat]);
    return Math.abs(p2.x - p1.x);
  }

  // Draw approach corridors with directional arrows
  for (const corridor of intel.corridors) {
    if (corridor.waypoints.length < 2) continue;
    mctx.beginPath();
    mctx.strokeStyle = 'rgba(50, 164, 103, 0.6)';
    mctx.lineWidth = 2;
    mctx.setLineDash([6, 4]);
    const first = toScreen(corridor.waypoints[0]);
    mctx.moveTo(first.x, first.y);
    for (let i = 1; i < corridor.waypoints.length; i++) {
      const p = toScreen(corridor.waypoints[i]);
      mctx.lineTo(p.x, p.y);
    }
    mctx.stroke();
    mctx.setLineDash([]);

    // Arrowhead at last point
    const lastWp = corridor.waypoints;
    if (lastWp.length >= 2) {
      const from = toScreen(lastWp[lastWp.length - 2]);
      const to = toScreen(lastWp[lastWp.length - 1]);
      drawArrowhead(mctx, from, to, 'rgba(50, 164, 103, 0.8)', 8);
    }

    // Corridor label at midpoint
    const mid = corridor.waypoints[Math.floor(corridor.waypoints.length / 2)];
    const midScreen = toScreen(mid);
    mctx.font = '10px -apple-system, sans-serif';
    mctx.fillStyle = '#32A467';
    mctx.textAlign = 'center';
    mctx.fillText(corridor.name, midScreen.x, midScreen.y - 10);
  }

  // Draw estimated threat zones (radius circles)
  for (const marker of intel.markers) {
    if (marker.radiusMeters <= 0) continue;
    const p = toScreen(marker.position);
    const r = metersToPixels(marker.radiusMeters, marker.position.lat);
    if (r < 3) continue;

    if (marker.accuracy === 'ESTIMATED') {
      mctx.beginPath();
      mctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      mctx.fillStyle = marker.threatType === 'SAM' ? 'rgba(231, 106, 110, 0.08)' : 'rgba(236, 154, 60, 0.06)';
      mctx.fill();
      mctx.strokeStyle = marker.threatType === 'SAM' ? 'rgba(231, 106, 110, 0.35)' : 'rgba(236, 154, 60, 0.3)';
      mctx.lineWidth = 1;
      mctx.setLineDash([4, 3]);
      mctx.stroke();
      mctx.setLineDash([]);
    }
  }

  // Draw confirmed markers (point markers with icon shapes)
  for (const marker of intel.markers) {
    if (marker.radiusMeters > 0 && marker.accuracy !== 'CONFIRMED') continue;
    const p = toScreen(marker.position);
    const color = marker.accuracy === 'CONFIRMED' ? '#E76A6E' : '#EC9A3C';
    const size = 6;

    if (marker.threatType === 'SAM') {
      mctx.beginPath();
      mctx.moveTo(p.x, p.y - size);
      mctx.lineTo(p.x + size, p.y);
      mctx.lineTo(p.x, p.y + size);
      mctx.lineTo(p.x - size, p.y);
      mctx.closePath();
      mctx.fillStyle = color;
      mctx.fill();
    } else if (marker.threatType === 'RADAR' || marker.threatType === 'EW') {
      mctx.beginPath();
      mctx.moveTo(p.x, p.y - size);
      mctx.lineTo(p.x + size, p.y + size);
      mctx.lineTo(p.x - size, p.y + size);
      mctx.closePath();
      mctx.fillStyle = color;
      mctx.fill();
    } else if (marker.threatType === 'COMMAND') {
      mctx.fillStyle = color;
      mctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    } else {
      mctx.beginPath();
      mctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      mctx.fillStyle = color;
      mctx.fill();
    }

    mctx.font = '9px -apple-system, sans-serif';
    mctx.fillStyle = '#ABB3BF';
    mctx.textAlign = 'center';
    mctx.fillText(marker.label, p.x, p.y + size + 12);
  }

  // Draw friendly base
  for (const spawn of scenario.entities) {
    if (spawn.faction !== 'BLUE' || spawn.platformId !== 'AIRBASE') continue;
    const p = toScreen(spawn.position);
    mctx.fillStyle = '#4C90F0';
    mctx.fillRect(p.x - 7, p.y - 7, 14, 14);
    mctx.strokeStyle = '#2D72D2';
    mctx.lineWidth = 1.5;
    mctx.strokeRect(p.x - 7, p.y - 7, 14, 14);
    mctx.font = '10px -apple-system, sans-serif';
    mctx.fillStyle = '#4C90F0';
    mctx.textAlign = 'center';
    mctx.fillText('FOB', p.x, p.y + 20);
  }
}

/** Draw an arrowhead at the tip of a line segment */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  size: number,
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// --- Mission Select ---

const missionSelectEl = document.getElementById('mission-select')!;
const missionCardsEl = document.getElementById('mission-cards')!;
const missionTitleEl = document.querySelector('.mission-title') as HTMLElement;

function populateMissionSelect(): void {
  missionCardsEl.innerHTML = '';
  const scenarios = getAllScenarios();

  for (const scenario of scenarios) {
    const card = document.createElement('div');
    card.className = 'mission-card';

    const objCount = scenario.objectives.length;
    const durationText = isFinite(scenario.duration) ? ` &middot; ${Math.floor(scenario.duration / 60)} min` : '';

    card.innerHTML = `
      <div class="mission-card-name">${scenario.name}</div>
      <div class="mission-card-desc">${scenario.description}</div>
      <div class="mission-card-meta">
        <span class="mission-card-objectives">${objCount} objective${objCount !== 1 ? 's' : ''}${durationText}</span>
        <button class="mission-card-launch">LAUNCH</button>
      </div>
    `;

    card.querySelector('.mission-card-launch')!.addEventListener('click', (e) => {
      e.stopPropagation();
      showBriefing(scenario);
    });
    card.addEventListener('click', () => {
      showBriefing(scenario);
    });

    missionCardsEl.appendChild(card);
  }
}

function launchScenario(scenarioId: string, scenarioName: string): void {
  resetEntityCounter();

  destroyMap();

  const scenario = getScenario(scenarioId);

  const mapConfig: { center: [number, number]; zoom: number; maxBounds?: [[number, number], [number, number]] } = {
    center: [scenario.mapCenter.lon, scenario.mapCenter.lat],
    zoom: scenario.mapZoom,
  };
  if (scenario.maxBounds) {
    mapConfig.maxBounds = [
      [scenario.maxBounds.west - 0.5, scenario.maxBounds.south - 0.5],
      [scenario.maxBounds.east + 0.5, scenario.maxBounds.north + 0.5],
    ];
  }
  initMap('map', mapConfig);

  gameState = createInitialState(scenarioId);
  camera = createCamera(window.innerWidth, window.innerHeight);
  lastTimestamp = 0;
  missionActive = true;
  taskCounter = 0;

  // Reset planner
  plannerState = createInitialPlannerState();
  plannerOpen = false;
  queuePanelOpen = false;
  plannerTargetMode = false;
  plannerPanel.classList.remove('visible');
  queuePanel.classList.remove('visible');

  // Always show intel dashboard and shift game area
  intelDashboardOpen = true;
  intelDashboard.classList.add('visible');
  document.getElementById('game-container')!.classList.add('intel-open');

  // Reset event tracking
  prevDestroyedIds = new Set();
  prevDetectedContacts = new Set();
  prevBingoIds = new Set();
  eventCounter = 0;

  // Store intel markers for game map overlay
  activeScenarioIntel = scenario.intel?.markers ?? [];

  missionTitleEl.textContent = `NEXUS // ${scenarioName.toUpperCase()}`;

  missionSelectEl.classList.add('hidden');

  resizeCanvas();

  // Auto-open mission planner after briefing
  plannerOpen = true;
  plannerPanel.classList.add('visible');
  plannerState = resetPlanner();
  renderPlannerPanel();
}

function showMissionSelect(): void {
  missionActive = false;
  destroyMap();
  intelDashboardOpen = false;
  intelDashboard.classList.remove('visible');
  document.getElementById('game-container')!.classList.remove('intel-open');
  missionSelectEl.classList.remove('hidden');
  populateMissionSelect();
}

// Handle keyboard shortcut to return to missions after game over
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gameState.missionResult !== 'PENDING') {
    showMissionSelect();
  }
});

// --- Start ---

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
populateMissionSelect();
requestAnimationFrame(gameLoop);
