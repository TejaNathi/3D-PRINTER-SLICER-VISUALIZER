"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _distance = _interopRequireDefault(require("gl-vec3/distance"));

var _squaredDistance = _interopRequireDefault(require("gl-vec3/squaredDistance"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var debug = require('debug')('halfedge');

var HalfEdge = /*#__PURE__*/function () {
  function HalfEdge(vertex, face) {
    _classCallCheck(this, HalfEdge);

    this.vertex = vertex;
    this.face = face;
    this.next = null;
    this.prev = null;
    this.opposite = null;
  }

  _createClass(HalfEdge, [{
    key: "head",
    value: function head() {
      return this.vertex;
    }
  }, {
    key: "tail",
    value: function tail() {
      return this.prev ? this.prev.vertex : null;
    }
  }, {
    key: "length",
    value: function length() {
      if (this.tail()) {
        return (0, _distance["default"])(this.tail().point, this.head().point);
      }

      return -1;
    }
  }, {
    key: "lengthSquared",
    value: function lengthSquared() {
      if (this.tail()) {
        return (0, _squaredDistance["default"])(this.tail().point, this.head().point);
      }

      return -1;
    }
  }, {
    key: "setOpposite",
    value: function setOpposite(edge) {
      var me = this;

      if (debug.enabled) {
        debug("opposite ".concat(me.tail().index, " <--> ").concat(me.head().index, " between ").concat(me.face.collectIndices(), ", ").concat(edge.face.collectIndices()));
      }

      this.opposite = edge;
      edge.opposite = this;
    }
  }]);

  return HalfEdge;
}();

exports["default"] = HalfEdge;