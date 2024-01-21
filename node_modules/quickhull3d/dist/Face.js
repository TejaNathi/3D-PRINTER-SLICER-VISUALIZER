"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VISIBLE = exports.NON_CONVEX = exports.DELETED = void 0;

var _dot = _interopRequireDefault(require("gl-vec3/dot"));

var _add = _interopRequireDefault(require("gl-vec3/add"));

var _subtract = _interopRequireDefault(require("gl-vec3/subtract"));

var _cross = _interopRequireDefault(require("gl-vec3/cross"));

var _copy = _interopRequireDefault(require("gl-vec3/copy"));

var _length = _interopRequireDefault(require("gl-vec3/length"));

var _scale = _interopRequireDefault(require("gl-vec3/scale"));

var _scaleAndAdd = _interopRequireDefault(require("gl-vec3/scaleAndAdd"));

var _normalize = _interopRequireDefault(require("gl-vec3/normalize"));

var _HalfEdge = _interopRequireDefault(require("./HalfEdge"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var debug = require('debug')('face');

var VISIBLE = 0;
exports.VISIBLE = VISIBLE;
var NON_CONVEX = 1;
exports.NON_CONVEX = NON_CONVEX;
var DELETED = 2;
exports.DELETED = DELETED;

var Face = /*#__PURE__*/function () {
  function Face() {
    _classCallCheck(this, Face);

    this.normal = [];
    this.centroid = []; // signed distance from face to the origin

    this.offset = 0; // pointer to the a vertex in a double linked list this face can see

    this.outside = null;
    this.mark = VISIBLE;
    this.edge = null;
    this.nVertices = 0;
  }

  _createClass(Face, [{
    key: "getEdge",
    value: function getEdge(i) {
      if (typeof i !== 'number') {
        throw Error('requires a number');
      }

      var it = this.edge;

      while (i > 0) {
        it = it.next;
        i -= 1;
      }

      while (i < 0) {
        it = it.prev;
        i += 1;
      }

      return it;
    }
  }, {
    key: "computeNormal",
    value: function computeNormal() {
      var e0 = this.edge;
      var e1 = e0.next;
      var e2 = e1.next;
      var v2 = (0, _subtract["default"])([], e1.head().point, e0.head().point);
      var t = [];
      var v1 = [];
      this.nVertices = 2;
      this.normal = [0, 0, 0];

      while (e2 !== e0) {
        (0, _copy["default"])(v1, v2);
        (0, _subtract["default"])(v2, e2.head().point, e0.head().point);
        (0, _add["default"])(this.normal, this.normal, (0, _cross["default"])(t, v1, v2));
        e2 = e2.next;
        this.nVertices += 1;
      }

      this.area = (0, _length["default"])(this.normal); // normalize the vector, since we've already calculated the area
      // it's cheaper to scale the vector using this quantity instead of
      // doing the same operation again

      this.normal = (0, _scale["default"])(this.normal, this.normal, 1 / this.area);
    }
  }, {
    key: "computeNormalMinArea",
    value: function computeNormalMinArea(minArea) {
      this.computeNormal();

      if (this.area < minArea) {
        // compute the normal without the longest edge
        var maxEdge;
        var maxSquaredLength = 0;
        var edge = this.edge; // find the longest edge (in length) in the chain of edges

        do {
          var lengthSquared = edge.lengthSquared();

          if (lengthSquared > maxSquaredLength) {
            maxEdge = edge;
            maxSquaredLength = lengthSquared;
          }

          edge = edge.next;
        } while (edge !== this.edge);

        var p1 = maxEdge.tail().point;
        var p2 = maxEdge.head().point;
        var maxVector = (0, _subtract["default"])([], p2, p1);
        var maxLength = Math.sqrt(maxSquaredLength); // maxVector is normalized after this operation

        (0, _scale["default"])(maxVector, maxVector, 1 / maxLength); // compute the projection of maxVector over this face normal

        var maxProjection = (0, _dot["default"])(this.normal, maxVector); // subtract the quantity maxEdge adds on the normal

        (0, _scaleAndAdd["default"])(this.normal, this.normal, maxVector, -maxProjection); // renormalize `this.normal`

        (0, _normalize["default"])(this.normal, this.normal);
      }
    }
  }, {
    key: "computeCentroid",
    value: function computeCentroid() {
      this.centroid = [0, 0, 0];
      var edge = this.edge;

      do {
        (0, _add["default"])(this.centroid, this.centroid, edge.head().point);
        edge = edge.next;
      } while (edge !== this.edge);

      (0, _scale["default"])(this.centroid, this.centroid, 1 / this.nVertices);
    }
  }, {
    key: "computeNormalAndCentroid",
    value: function computeNormalAndCentroid(minArea) {
      if (typeof minArea !== 'undefined') {
        this.computeNormalMinArea(minArea);
      } else {
        this.computeNormal();
      }

      this.computeCentroid();
      this.offset = (0, _dot["default"])(this.normal, this.centroid);
    }
  }, {
    key: "distanceToPlane",
    value: function distanceToPlane(point) {
      return (0, _dot["default"])(this.normal, point) - this.offset;
    }
    /**
     * @private
     *
     * Connects two edges assuming that prev.head().point === next.tail().point
     *
     * @param {HalfEdge} prev
     * @param {HalfEdge} next
     */

  }, {
    key: "connectHalfEdges",
    value: function connectHalfEdges(prev, next) {
      var discardedFace;

      if (prev.opposite.face === next.opposite.face) {
        // `prev` is remove a redundant edge
        var oppositeFace = next.opposite.face;
        var oppositeEdge;

        if (prev === this.edge) {
          this.edge = next;
        }

        if (oppositeFace.nVertices === 3) {
          // case:
          // remove the face on the right
          //
          //       /|\
          //      / | \ the face on the right
          //     /  |  \ --> opposite edge
          //    / a |   \
          //   *----*----*
          //  /     b  |  \
          //           ▾
          //      redundant edge
          //
          // Note: the opposite edge is actually in the face to the right
          // of the face to be destroyed
          oppositeEdge = next.opposite.prev.opposite;
          oppositeFace.mark = DELETED;
          discardedFace = oppositeFace;
        } else {
          // case:
          //          t
          //        *----
          //       /| <- right face's redundant edge
          //      / | opposite edge
          //     /  |  ▴   /
          //    / a |  |  /
          //   *----*----*
          //  /     b  |  \
          //           ▾
          //      redundant edge
          oppositeEdge = next.opposite.next; // make sure that the link `oppositeFace.edge` points correctly even
          // after the right face redundant edge is removed

          if (oppositeFace.edge === oppositeEdge.prev) {
            oppositeFace.edge = oppositeEdge;
          } //       /|   /
          //      / | t/opposite edge
          //     /  | / ▴  /
          //    / a |/  | /
          //   *----*----*
          //  /     b     \


          oppositeEdge.prev = oppositeEdge.prev.prev;
          oppositeEdge.prev.next = oppositeEdge;
        } //       /|
        //      / |
        //     /  |
        //    / a |
        //   *----*----*
        //  /     b  ▴  \
        //           |
        //     redundant edge


        next.prev = prev.prev;
        next.prev.next = next; //       / \  \
        //      /   \->\
        //     /     \<-\ opposite edge
        //    / a     \  \
        //   *----*----*
        //  /     b  ^  \

        next.setOpposite(oppositeEdge);
        oppositeFace.computeNormalAndCentroid();
      } else {
        // trivial case
        //        *
        //       /|\
        //      / | \
        //     /  |--> next
        //    / a |   \
        //   *----*----*
        //    \ b |   /
        //     \  |--> prev
        //      \ | /
        //       \|/
        //        *
        prev.next = next;
        next.prev = prev;
      }

      return discardedFace;
    }
  }, {
    key: "mergeAdjacentFaces",
    value: function mergeAdjacentFaces(adjacentEdge, discardedFaces) {
      var oppositeEdge = adjacentEdge.opposite;
      var oppositeFace = oppositeEdge.face;
      discardedFaces.push(oppositeFace);
      oppositeFace.mark = DELETED; // find the chain of edges whose opposite face is `oppositeFace`
      //
      //                ===>
      //      \         face         /
      //       * ---- * ---- * ---- *
      //      /     opposite face    \
      //                <===
      //

      var adjacentEdgePrev = adjacentEdge.prev;
      var adjacentEdgeNext = adjacentEdge.next;
      var oppositeEdgePrev = oppositeEdge.prev;
      var oppositeEdgeNext = oppositeEdge.next; // left edge

      while (adjacentEdgePrev.opposite.face === oppositeFace) {
        adjacentEdgePrev = adjacentEdgePrev.prev;
        oppositeEdgeNext = oppositeEdgeNext.next;
      } // right edge


      while (adjacentEdgeNext.opposite.face === oppositeFace) {
        adjacentEdgeNext = adjacentEdgeNext.next;
        oppositeEdgePrev = oppositeEdgePrev.prev;
      } // adjacentEdgePrev  \         face         / adjacentEdgeNext
      //                    * ---- * ---- * ---- *
      // oppositeEdgeNext  /     opposite face    \ oppositeEdgePrev
      // fix the face reference of all the opposite edges that are not part of
      // the edges whose opposite face is not `face` i.e. all the edges that
      // `face` and `oppositeFace` do not have in common


      var edge;

      for (edge = oppositeEdgeNext; edge !== oppositeEdgePrev.next; edge = edge.next) {
        edge.face = this;
      } // make sure that `face.edge` is not one of the edges to be destroyed
      // Note: it's important for it to be a `next` edge since `prev` edges
      // might be destroyed on `connectHalfEdges`


      this.edge = adjacentEdgeNext; // connect the extremes
      // Note: it might be possible that after connecting the edges a triangular
      // face might be redundant

      var discardedFace;
      discardedFace = this.connectHalfEdges(oppositeEdgePrev, adjacentEdgeNext);

      if (discardedFace) {
        discardedFaces.push(discardedFace);
      }

      discardedFace = this.connectHalfEdges(adjacentEdgePrev, oppositeEdgeNext);

      if (discardedFace) {
        discardedFaces.push(discardedFace);
      }

      this.computeNormalAndCentroid(); // TODO: additional consistency checks

      return discardedFaces;
    }
  }, {
    key: "collectIndices",
    value: function collectIndices() {
      var indices = [];
      var edge = this.edge;

      do {
        indices.push(edge.head().index);
        edge = edge.next;
      } while (edge !== this.edge);

      return indices;
    }
  }], [{
    key: "createTriangle",
    value: function createTriangle(v0, v1, v2) {
      var minArea = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var face = new Face();
      var e0 = new _HalfEdge["default"](v0, face);
      var e1 = new _HalfEdge["default"](v1, face);
      var e2 = new _HalfEdge["default"](v2, face); // join edges

      e0.next = e2.prev = e1;
      e1.next = e0.prev = e2;
      e2.next = e1.prev = e0; // main half edge reference

      face.edge = e0;
      face.computeNormalAndCentroid(minArea);

      if (debug.enabled) {
        debug('face created %j', face.collectIndices());
      }

      return face;
    }
  }]);

  return Face;
}();

exports["default"] = Face;