"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = runner;
exports.isPointInsideHull = isPointInsideHull;

var _QuickHull = _interopRequireDefault(require("./QuickHull"));

var _getPlaneNormal = _interopRequireDefault(require("get-plane-normal"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function runner(points) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var instance = new _QuickHull["default"](points);
  instance.build();
  return instance.collectFaces(options.skipTriangulation);
}
/**
 * Checks if a point is inside the convex hull.
 *
 * @param {Array<number>} point - The point to check.
 * @param {Array<Array<number>>} points - The points used in the space where the
 * convex hull is defined.
 * @param {Array<Array<number>>} faces - The faces of the convex hull.
 */


function isPointInsideHull(point, points, faces) {
  for (var i = 0; i < faces.length; i++) {
    var face = faces[i];
    var a = points[face[0]];
    var b = points[face[1]];
    var c = points[face[2]]; // Algorithm:
    // 1. Get the normal of the face.
    // 2. Get the vector from the point to the first vertex of the face.
    // 3. Calculate the dot product of the normal and the vector.
    // 4. If the dot product is positive, the point is outside the face.

    var planeNormal = (0, _getPlaneNormal["default"])([], a, b, c); // Get the point

    var pointAbsA = [point[0] - a[0], point[1] - a[1], point[2] - a[2]];
    var dotProduct = planeNormal[0] * pointAbsA[0] + planeNormal[1] * pointAbsA[1] + planeNormal[2] * pointAbsA[2];

    if (dotProduct > 0) {
      return false;
    }
  }

  return true;
}