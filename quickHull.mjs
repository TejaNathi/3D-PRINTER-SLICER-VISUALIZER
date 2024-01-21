// QuickHull implementation
export function quickHull(points) {
    if (points.length < 4) return points;

    // Find the convex hull
    let convexHull = [];

    // Find the two points with the minimum and maximum x coordinates
    let maxX = -Infinity, minX = Infinity;
    let maxPt, minPt;

    points.forEach(pt => {
        if (pt.x > maxX) {
            maxX = pt.x;
            maxPt = pt;
        }
        if (pt.x < minX) {
            minX = pt.x;
            minPt = pt;
        }
    });

    // Add the two points to the convex hull
    convexHull.push(minPt, maxPt);

    // Split the set of points into two sets on either side of the line formed by minPt and maxPt
    const leftSet = [];
    const rightSet = [];

    for (const pt of points) {
        if (pt !== minPt && pt !== maxPt) {
            if (isPointLeftOfLine(minPt, maxPt, pt)) {
                leftSet.push(pt);
            } else {
                rightSet.push(pt);
            }
        }
    }

    hullSet(minPt, maxPt, rightSet, convexHull);
    hullSet(maxPt, minPt, leftSet, convexHull);

    return convexHull;
}

function hullSet(pointA, pointB, set, hull) {
    const insertIndex = hull.indexOf(pointB);
    if (set.length === 0) return;

    if (set.length === 1) {
        const p = set[0];
        set.splice(0, 1);
        hull.splice(insertIndex, 0, p);
        return;
    }

    const dist = [];
    for (const pt of set) {
        dist[pt] = distance(pointA, pointB, pt);
    }

    const maxDistIndex = dist.indexOf(Math.max(...dist));
    const maxDistPoint = set[maxDistIndex];

    set.splice(maxDistIndex, 1);
    hull.splice(insertIndex, 0, maxDistPoint);

    // Recur for the two new sets of points
    const leftSetAP = [];
    for (const pt of set) {
        if (isPointLeftOfLine(pointA, maxDistPoint, pt)) {
            leftSetAP.push(pt);
        }
    }

    const leftSetPB = [];
    for (const pt of set) {
        if (isPointLeftOfLine(maxDistPoint, pointB, pt)) {
            leftSetPB.push(pt);
        }
    }

    hullSet(pointA, maxDistPoint, leftSetAP, hull);
    hullSet(maxDistPoint, pointB, leftSetPB, hull);
}

function distance(pointA, pointB, pointC) {
    const AB = { x: pointB.x - pointA.x, y: pointB.y - pointA.y };
    const AC = { x: pointC.x - pointA.x, y: pointC.y - pointA.y };
    const crossProduct = AB.x * AC.y - AB.y * AC.x;

    return Math.abs(crossProduct) / Math.sqrt(AB.x * AB.x + AB.y * AB.y);
}

function isPointLeftOfLine(pointA, pointB, pointC) {
    const AB = { x: pointB.x - pointA.x, y: pointB.y - pointA.y };
    const AC = { x: pointC.x - pointA.x, y: pointC.y - pointA.y };
    const crossProduct = AB.x * AC.y - AB.y * AC.x;

    return crossProduct > 0;
}
