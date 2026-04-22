import * as THREE from 'three';

const DEFAULT_EPSILON = 1e-4;

/**
 * Projects a 3D point to 2D based on the selected axis.
 * - axis=y => XZ footprint (typical printer bed projection)
 * - axis=x => YZ projection
 * - axis=z => XY projection
 */
function projectVertex(vertex, axis = 'y') {
  switch (axis.toLowerCase()) {
    case 'x':
      return new THREE.Vector2(vertex.y, vertex.z);
    case 'z':
      return new THREE.Vector2(vertex.x, vertex.y);
    case 'y':
    default:
      return new THREE.Vector2(vertex.x, vertex.z);
  }
}

/** Snaps floating point values to a fixed grid so near-identical points share the same key. */
function quantize(value, epsilon) {
  return Math.round(value / epsilon) * epsilon;
}

/** Creates a stable string key for a 2D point after quantization. */
function pointKey(point, epsilon) {
  return `${quantize(point.x, epsilon)},${quantize(point.y, epsilon)}`;
}

/** Produces an order-independent edge key so AB and BA are treated as the same edge. */
function edgeKey(aKey, bKey) {
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

/** Returns triangle area in 2D; used to skip degenerate projected triangles. */
function triangleArea2D(a, b, c) {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5;
}

/** Signed polygon area (positive = CCW winding, negative = CW winding). */
function polygonArea(points) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return area * 0.5;
}

/**
 * Removes points that are collinear with their neighbors.
 * This simplifies noisy outlines and keeps only the corner vertices.
 */
function removeCollinearPoints(points, epsilon) {
  if (points.length < 4) return points;

  const cleaned = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
    if (Math.abs(cross) > epsilon) {
      cleaned.push(curr);
    }
  }

  return cleaned.length >= 3 ? cleaned : points;
}

/**
 * Reconstructs closed boundary loops from a list of boundary edges.
 * Boundary edges are edges that belong to exactly one projected triangle.
 */
function collectBoundaryLoops(boundaryEdges, pointsByKey, epsilon) {
  const adjacency = new Map();

  boundaryEdges.forEach((edge) => {
    if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
    if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
    adjacency.get(edge.a).push(edge.b);
    adjacency.get(edge.b).push(edge.a);
  });

  const visited = new Set();
  const loops = [];

  boundaryEdges.forEach((seedEdge) => {
    const seedId = edgeKey(seedEdge.a, seedEdge.b);
    if (visited.has(seedId)) return;

    const loopKeys = [seedEdge.a];
    let prev = seedEdge.a;
    let curr = seedEdge.b;
    visited.add(seedId);

    let guard = 0;
    while (guard < boundaryEdges.length + 5) {
      guard += 1;
      loopKeys.push(curr);

      if (curr === loopKeys[0]) break;

      const neighbors = adjacency.get(curr) || [];
      if (neighbors.length === 0) break;

      const next = neighbors.find((candidate) => candidate !== prev && !visited.has(edgeKey(curr, candidate)))
        || neighbors.find((candidate) => candidate !== prev)
        || neighbors[0];

      const currentEdgeId = edgeKey(curr, next);
      if (visited.has(currentEdgeId) && next === loopKeys[0]) {
        loopKeys.push(next);
        break;
      }

      visited.add(currentEdgeId);
      prev = curr;
      curr = next;

      if (curr === loopKeys[0]) {
        loopKeys.push(curr);
        break;
      }
    }

    if (loopKeys.length >= 4 && loopKeys[0] === loopKeys[loopKeys.length - 1]) {
      const points = loopKeys.slice(0, -1).map((key) => pointsByKey.get(key));
      const simplified = removeCollinearPoints(points, epsilon);
      loops.push(simplified);
    }
  });

  return loops;
}

/**
 * Builds a 2D footprint from a 3D geometry by:
 * 1) projecting each triangle to 2D
 * 2) counting edges and keeping only boundary edges
 * 3) building closed loops from the boundary graph
 * 4) returning the largest loop as the outer footprint
 */
export function buildProjectedFootprint(geometry, options = {}) {
  const axis = options.axis || 'y';
  const epsilon = options.epsilon || DEFAULT_EPSILON;

  if (!geometry?.attributes?.position) {
    return { points: [], loops: [] };
  }

  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = nonIndexed.attributes.position.array;

  const pointsByKey = new Map();
  const edgeCounts = new Map();

  for (let i = 0; i < positions.length; i += 9) {
    const a3 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
    const b3 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
    const c3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

    const a = projectVertex(a3, axis);
    const b = projectVertex(b3, axis);
    const c = projectVertex(c3, axis);

    if (triangleArea2D(a, b, c) <= epsilon) {
      continue;
    }

    const aKey = pointKey(a, epsilon);
    const bKey = pointKey(b, epsilon);
    const cKey = pointKey(c, epsilon);

    pointsByKey.set(aKey, a);
    pointsByKey.set(bKey, b);
    pointsByKey.set(cKey, c);

    [
      [aKey, bKey],
      [bKey, cKey],
      [cKey, aKey],
    ].forEach(([p, q]) => {
      const key = edgeKey(p, q);
      const current = edgeCounts.get(key) || { count: 0, a: p, b: q };
      current.count += 1;
      edgeCounts.set(key, current);
    });
  }

  const boundaryEdges = Array.from(edgeCounts.values()).filter((edge) => edge.count === 1);
  const loops = collectBoundaryLoops(boundaryEdges, pointsByKey, epsilon)
    .filter((loop) => loop.length >= 3);

  if (loops.length === 0) {
    return { points: [], loops: [] };
  }

  loops.sort((left, right) => Math.abs(polygonArea(right)) - Math.abs(polygonArea(left)));
  const outerLoop = loops[0];

  if (polygonArea(outerLoop) < 0) {
    outerLoop.reverse();
  }

  return {
    points: outerLoop,
    loops,
  };
}

/**
 * Converts an ordered polygon point list to THREE.Shape so callers can create
 * ShapeGeometry for preview or downstream triangulation.
 */
export function createShapeFromPoints(points) {
  if (!points || points.length < 3) return null;

  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();
  return shape;
}
