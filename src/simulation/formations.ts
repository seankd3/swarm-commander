import type { Position, FormationType } from './types';
import { movePosition } from './geo';

/** Calculate formation positions around a target point */
export function getFormationPositions(
  target: Position,
  count: number,
  formation: FormationType,
  approachHeading: number,
  spacing: number,
): Position[] {
  if (count <= 1 || formation === 'NONE') {
    return Array.from({ length: count }, () => target);
  }

  const positions: Position[] = [];
  const perpHeading = (approachHeading + 90) % 360;

  switch (formation) {
    case 'LINE': {
      const halfWidth = ((count - 1) * spacing) / 2;
      for (let i = 0; i < count; i++) {
        const offset = -halfWidth + i * spacing;
        positions.push(movePosition(target, perpHeading, offset));
      }
      break;
    }
    case 'COLUMN': {
      const reverseHeading = (approachHeading + 180) % 360;
      for (let i = 0; i < count; i++) {
        positions.push(movePosition(target, reverseHeading, i * spacing));
      }
      break;
    }
    case 'WEDGE': {
      positions.push(target);
      const reverseHeading = (approachHeading + 180) % 360;
      for (let i = 1; i < count; i++) {
        const side = i % 2 === 1 ? 1 : -1;
        const row = Math.ceil(i / 2);
        const backOffset = row * spacing;
        const sideOffset = side * row * spacing;
        let pos = movePosition(target, reverseHeading, backOffset);
        pos = movePosition(pos, perpHeading, sideOffset);
        positions.push(pos);
      }
      break;
    }
  }

  return positions;
}
