(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Tokenizr = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
"use strict";

function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return _wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return _construct(t, arguments, _getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), _setPrototypeOf(Wrapper, t); }, _wrapNativeSuper(t); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
**  Tokenizr -- String Tokenization Library
**  Copyright (c) 2015-2024 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  utility function: create a source excerpt  */
var excerpt = function excerpt(txt, o) {
  var l = txt.length;
  var b = o - 20;
  if (b < 0) b = 0;
  var e = o + 20;
  if (e > l) e = l;
  var hex = function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  };
  var extract = function extract(txt, pos, len) {
    return txt.substr(pos, len).replace(/\\/g, "\\\\").replace(/\x08/g, "\\b").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\f/g, "\\f").replace(/\r/g, "\\r").replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x80-\xFF]/g, function (ch) {
      return "\\x" + hex(ch);
    }).replace(/[\u0100-\u0FFF]/g, function (ch) {
      return "\\u0" + hex(ch);
    }).replace(/[\u1000-\uFFFF]/g, function (ch) {
      return "\\u" + hex(ch);
    });
  };
  return {
    prologTrunc: b > 0,
    prologText: extract(txt, b, o - b),
    tokenText: extract(txt, o, 1),
    epilogText: extract(txt, o + 1, e - (o + 1)),
    epilogTrunc: e < l
  };
};

/*  internal helper class for token representation  */
var Token = /*#__PURE__*/function () {
  function Token(type, value, text) {
    var pos = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var line = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var column = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    _classCallCheck(this, Token);
    this.type = type;
    this.value = value;
    this.text = text;
    this.pos = pos;
    this.line = line;
    this.column = column;
  }
  return _createClass(Token, [{
    key: "toString",
    value: function toString() {
      var colorize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (type, text) {
        return text;
      };
      return "".concat(colorize("type", this.type), " ") + "(value: ".concat(colorize("value", JSON.stringify(this.value)), ", ") + "text: ".concat(colorize("text", JSON.stringify(this.text)), ", ") + "pos: ".concat(colorize("pos", this.pos), ", ") + "line: ".concat(colorize("line", this.line), ", ") + "column: ".concat(colorize("column", this.column), ")");
    }
  }, {
    key: "isA",
    value: function isA(type, value) {
      if (type !== this.type) return false;
      if (arguments.length === 2 && value !== this.value) return false;
      return true;
    }
  }]);
}();
/*  internal helper class for tokenization error reporting  */
var ParsingError = /*#__PURE__*/function (_Error) {
  /*  construct and initialize object  */
  function ParsingError(message, pos, line, column, input) {
    var _this;
    _classCallCheck(this, ParsingError);
    _this = _callSuper(this, ParsingError, [message]);
    _this.name = "ParsingError";
    _this.message = message;
    _this.pos = pos;
    _this.line = line;
    _this.column = column;
    _this.input = input;
    return _this;
  }

  /*  render a useful string representation  */
  _inherits(ParsingError, _Error);
  return _createClass(ParsingError, [{
    key: "toString",
    value: function toString() {
      var l = excerpt(this.input, this.pos);
      var prefix1 = "line ".concat(this.line, " (column ").concat(this.column, "): ");
      var prefix2 = "";
      for (var i = 0; i < prefix1.length + l.prologText.length; i++) prefix2 += " ";
      var msg = "Parsing Error: " + this.message + "\n" + prefix1 + l.prologText + l.tokenText + l.epilogText + "\n" + prefix2 + "^";
      return msg;
    }
  }]);
}( /*#__PURE__*/_wrapNativeSuper(Error));
/*  internal helper class for action context  */
var ActionContext = /*#__PURE__*/function () {
  /*  construct and initialize the object  */
  function ActionContext(tokenizr) {
    _classCallCheck(this, ActionContext);
    this._tokenizr = tokenizr;
    this._data = {};
    this._repeat = false;
    this._reject = false;
    this._ignore = false;
    this._match = null;
  }

  /*  store and retrieve user data attached to context  */
  return _createClass(ActionContext, [{
    key: "data",
    value: function data(key, value) {
      var valueOld = this._data[key];
      if (arguments.length === 2) this._data[key] = value;
      return valueOld;
    }

    /*  retrieve information of current matching  */
  }, {
    key: "info",
    value: function info() {
      return {
        line: this._tokenizr._line,
        column: this._tokenizr._column,
        pos: this._tokenizr._pos,
        len: this._match[0].length
      };
    }

    /*  pass-through functions to attached tokenizer  */
  }, {
    key: "push",
    value: function push() {
      var _this$_tokenizr;
      (_this$_tokenizr = this._tokenizr).push.apply(_this$_tokenizr, arguments);
      return this;
    }
  }, {
    key: "pop",
    value: function pop() {
      var _this$_tokenizr2;
      return (_this$_tokenizr2 = this._tokenizr).pop.apply(_this$_tokenizr2, arguments);
    }
  }, {
    key: "state",
    value: function state() {
      var _this$_tokenizr4;
      if (arguments.length > 0) {
        var _this$_tokenizr3;
        (_this$_tokenizr3 = this._tokenizr).state.apply(_this$_tokenizr3, arguments);
        return this;
      } else return (_this$_tokenizr4 = this._tokenizr).state.apply(_this$_tokenizr4, arguments);
    }
  }, {
    key: "tag",
    value: function tag() {
      var _this$_tokenizr5;
      (_this$_tokenizr5 = this._tokenizr).tag.apply(_this$_tokenizr5, arguments);
      return this;
    }
  }, {
    key: "tagged",
    value: function tagged() {
      var _this$_tokenizr6;
      return (_this$_tokenizr6 = this._tokenizr).tagged.apply(_this$_tokenizr6, arguments);
    }
  }, {
    key: "untag",
    value: function untag() {
      var _this$_tokenizr7;
      (_this$_tokenizr7 = this._tokenizr).untag.apply(_this$_tokenizr7, arguments);
      return this;
    }

    /*  mark current matching to be repeated from scratch  */
  }, {
    key: "repeat",
    value: function repeat() {
      this._tokenizr._log("    REPEAT");
      this._repeat = true;
      return this;
    }

    /*  mark current matching to be rejected  */
  }, {
    key: "reject",
    value: function reject() {
      this._tokenizr._log("    REJECT");
      this._reject = true;
      return this;
    }

    /*  mark current matching to be ignored  */
  }, {
    key: "ignore",
    value: function ignore() {
      this._tokenizr._log("    IGNORE");
      this._ignore = true;
      return this;
    }

    /*  accept current matching as a new token  */
  }, {
    key: "accept",
    value: function accept(type, value) {
      if (arguments.length < 2) value = this._match[0];
      this._tokenizr._log("    ACCEPT: type: ".concat(type, ", value: ") + "".concat(JSON.stringify(value), " (").concat(_typeof(value), "), text: \"").concat(this._match[0], "\""));
      this._tokenizr._pending.push(new Token(type, value, this._match[0], this._tokenizr._pos, this._tokenizr._line, this._tokenizr._column));
      return this;
    }

    /*  immediately stop tokenization  */
  }, {
    key: "stop",
    value: function stop() {
      this._tokenizr._stopped = true;
      return this;
    }
  }]);
}();
/*  external API class  */
var Tokenizr = /*#__PURE__*/function () {
  /*  construct and initialize the object  */
  function Tokenizr() {
    _classCallCheck(this, Tokenizr);
    this._before = null;
    this._after = null;
    this._finish = null;
    this._rules = [];
    this._debug = false;
    this.reset();
  }

  /*  reset the internal state  */
  return _createClass(Tokenizr, [{
    key: "reset",
    value: function reset() {
      this._input = "";
      this._len = 0;
      this._eof = false;
      this._pos = 0;
      this._line = 1;
      this._column = 1;
      this._state = ["default"];
      this._tag = {};
      this._transaction = [];
      this._pending = [];
      this._stopped = false;
      this._ctx = new ActionContext(this);
      return this;
    }

    /*  create an error message for the current position  */
  }, {
    key: "error",
    value: function error(message) {
      return new ParsingError(message, this._pos, this._line, this._column, this._input);
    }

    /*  configure debug operation  */
  }, {
    key: "debug",
    value: function debug(_debug) {
      this._debug = _debug;
      return this;
    }

    /*  output a debug message  */
  }, {
    key: "_log",
    value: function _log(msg) {
      /* eslint no-console: off */
      if (this._debug) console.log("tokenizr: ".concat(msg));
    }

    /*  provide (new) input string to tokenize  */
  }, {
    key: "input",
    value: function input(_input) {
      /*  sanity check arguments  */
      if (typeof _input !== "string") throw new Error("parameter \"input\" not a String");

      /*  reset state and store new input  */
      this.reset();
      this._input = _input;
      this._len = _input.length;
      return this;
    }

    /*  push state  */
  }, {
    key: "push",
    value: function push(state) {
      /*  sanity check arguments  */
      if (arguments.length !== 1) throw new Error("invalid number of arguments");
      if (typeof state !== "string") throw new Error("parameter \"state\" not a String");

      /*  push new state  */
      this._log("    STATE (PUSH): " + "old: <".concat(this._state[this._state.length - 1], ">, ") + "new: <".concat(state, ">"));
      this._state.push(state);
      return this;
    }

    /*  pop state  */
  }, {
    key: "pop",
    value: function pop() {
      /*  sanity check arguments  */
      if (arguments.length !== 0) throw new Error("invalid number of arguments");
      if (this._state.length < 2) throw new Error("no more custom states to pop");

      /*  pop old state  */
      this._log("    STATE (POP): " + "old: <".concat(this._state[this._state.length - 1], ">, ") + "new: <".concat(this._state[this._state.length - 2], ">"));
      return this._state.pop();
    }

    /*  get/set state  */
  }, {
    key: "state",
    value: function state(_state) {
      if (arguments.length === 1) {
        /*  sanity check arguments  */
        if (typeof _state !== "string") throw new Error("parameter \"state\" not a String");

        /*  change current state  */
        this._log("    STATE (SET): " + "old: <".concat(this._state[this._state.length - 1], ">, ") + "new: <".concat(_state, ">"));
        this._state[this._state.length - 1] = _state;
        return this;
      } else if (arguments.length === 0) return this._state[this._state.length - 1];else throw new Error("invalid number of arguments");
    }

    /*  set a tag  */
  }, {
    key: "tag",
    value: function tag(_tag) {
      /*  sanity check arguments  */
      if (arguments.length !== 1) throw new Error("invalid number of arguments");
      if (typeof _tag !== "string") throw new Error("parameter \"tag\" not a String");

      /*  set tag  */
      this._log("    TAG (ADD): ".concat(_tag));
      this._tag[_tag] = true;
      return this;
    }

    /*  check whether tag is set  */
  }, {
    key: "tagged",
    value: function tagged(tag) {
      /*  sanity check arguments  */
      if (arguments.length !== 1) throw new Error("invalid number of arguments");
      if (typeof tag !== "string") throw new Error("parameter \"tag\" not a String");

      /*  set tag  */
      return this._tag[tag] === true;
    }

    /*  unset a tag  */
  }, {
    key: "untag",
    value: function untag(tag) {
      /*  sanity check arguments  */
      if (arguments.length !== 1) throw new Error("invalid number of arguments");
      if (typeof tag !== "string") throw new Error("parameter \"tag\" not a String");

      /*  delete tag  */
      this._log("    TAG (DEL): ".concat(tag));
      delete this._tag[tag];
      return this;
    }

    /*  configure a tokenization before-rule callback  */
  }, {
    key: "before",
    value: function before(action) {
      this._before = action;
      return this;
    }

    /*  configure a tokenization after-rule callback  */
  }, {
    key: "after",
    value: function after(action) {
      this._after = action;
      return this;
    }

    /*  configure a tokenization finish callback  */
  }, {
    key: "finish",
    value: function finish(action) {
      this._finish = action;
      return this;
    }

    /*  configure a tokenization rule  */
  }, {
    key: "rule",
    value: function rule(state, pattern, action) {
      var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "unknown";
      /*  support optional states  */
      if (arguments.length === 2 && typeof pattern === "function") {
        var _ref = [state, pattern];
        pattern = _ref[0];
        action = _ref[1];
        state = "*";
      } else if (arguments.length === 3 && typeof pattern === "function") {
        var _ref2 = [state, pattern, action];
        pattern = _ref2[0];
        action = _ref2[1];
        name = _ref2[2];
        state = "*";
      }

      /*  sanity check arguments  */
      if (typeof state !== "string") throw new Error("parameter \"state\" not a String");
      if (!(_typeof(pattern) === "object" && pattern instanceof RegExp)) throw new Error("parameter \"pattern\" not a RegExp");
      if (typeof action !== "function") throw new Error("parameter \"action\" not a Function");
      if (typeof name !== "string") throw new Error("parameter \"name\" not a String");

      /*  post-process state  */
      state = state.split(/\s*,\s*/g).map(function (entry) {
        var items = entry.split(/\s+/g);
        var states = items.filter(function (item) {
          return item.match(/^#/) === null;
        });
        var tags = items.filter(function (item) {
          return item.match(/^#/) !== null;
        }).map(function (tag) {
          return tag.replace(/^#/, "");
        });
        if (states.length !== 1) throw new Error("exactly one state required");
        return {
          state: states[0],
          tags: tags
        };
      });

      /*  post-process pattern  */
      var flags = "g"; /* ECMAScript <= 5 */
      try {
        var regexp = new RegExp("", "y");
        if (typeof regexp.sticky === "boolean") flags = "y"; /* ECMAScript >= 2015 */
      } catch (ex) {
        /*  no-op  */
      }
      if (typeof pattern.multiline === "boolean" && pattern.multiline) flags += "m";
      if (typeof pattern.dotAll === "boolean" && pattern.dotAll) flags += "s";
      if (typeof pattern.ignoreCase === "boolean" && pattern.ignoreCase) flags += "i";
      if (typeof pattern.unicode === "boolean" && pattern.unicode) flags += "u";
      pattern = new RegExp(pattern.source, flags);

      /*  store rule  */
      this._log("rule: configure rule (state: ".concat(state, ", pattern: ").concat(pattern.source, ")"));
      this._rules.push({
        state: state,
        pattern: pattern,
        action: action,
        name: name
      });
      return this;
    }

    /*  progress the line/column counter  */
  }, {
    key: "_progress",
    value: function _progress(from, until) {
      var line = this._line;
      var column = this._column;
      var s = this._input;
      for (var i = from; i < until; i++) {
        var c = s.charAt(i);
        if (c === "\r") this._column = 1;else if (c === "\n") {
          this._line++;
          this._column = 1;
        } else if (c === "\t") this._column += 8 - this._column % 8;else this._column++;
      }
      this._log("    PROGRESS: characters: ".concat(until - from, ", ") + "from: <line ".concat(line, ", column ").concat(column, ">, ") + "to: <line ".concat(this._line, ", column ").concat(this._column, ">"));
    }

    /*  determine and provide the next token  */
  }, {
    key: "_tokenize",
    value: function _tokenize() {
      var _this2 = this;
      /*  helper function for finishing parsing  */
      var finish = function finish() {
        if (!_this2._eof) {
          if (_this2._finish !== null) _this2._finish.call(_this2._ctx, _this2._ctx);
          _this2._eof = true;
          _this2._pending.push(new Token("EOF", "", "", _this2._pos, _this2._line, _this2._column));
        }
      };

      /*  tokenize only as long as we were not stopped and there is input left  */
      if (this._stopped || this._pos >= this._len) {
        finish();
        return;
      }

      /*  loop...  */
      var continued = true;
      while (continued) {
        continued = false;

        /*  some optional debugging context  */
        if (this._debug) {
          var e = excerpt(this._input, this._pos);
          var tags = Object.keys(this._tag).map(function (tag) {
            return "#".concat(tag);
          }).join(" ");
          this._log("INPUT: state: <".concat(this._state[this._state.length - 1], ">, tags: <").concat(tags, ">, text: ") + (e.prologTrunc ? "..." : "\"") + "".concat(e.prologText, "<").concat(e.tokenText, ">").concat(e.epilogText) + (e.epilogTrunc ? "..." : "\"") + ", at: <line ".concat(this._line, ", column ").concat(this._column, ">"));
        }

        /*  iterate over all rules...  */
        for (var i = 0; i < this._rules.length; i++) {
          if (this._debug) {
            var state = this._rules[i].state.map(function (item) {
              var output = item.state;
              if (item.tags.length > 0) output += " " + item.tags.map(function (tag) {
                return "#".concat(tag);
              }).join(" ");
              return output;
            }).join(", ");
            this._log("  RULE: state(s): <".concat(state, ">, ") + "pattern: ".concat(this._rules[i].pattern.source));
          }

          /*  one of rule's states (and all of its tags) has to match  */
          var matches = false;
          var states = this._rules[i].state.map(function (item) {
            return item.state;
          });
          var idx = states.indexOf("*");
          if (idx < 0) idx = states.indexOf(this._state[this._state.length - 1]);
          if (idx >= 0) {
            matches = true;
            var _tags = this._rules[i].state[idx].tags;
            _tags = _tags.filter(function (tag) {
              return !_this2._tag[tag];
            });
            if (_tags.length > 0) matches = false;
          }
          if (!matches) continue;

          /*  match pattern at the last position  */
          this._rules[i].pattern.lastIndex = this._pos;
          var found = this._rules[i].pattern.exec(this._input);
          this._rules[i].pattern.lastIndex = this._pos;
          if ((found = this._rules[i].pattern.exec(this._input)) !== null && found.index === this._pos) {
            if (this._debug) this._log("    MATCHED: " + JSON.stringify(found));

            /*  pattern found, so give action a chance to operate
                on it and act according to its results  */
            this._ctx._match = found;
            this._ctx._repeat = false;
            this._ctx._reject = false;
            this._ctx._ignore = false;
            if (this._before !== null) this._before.call(this._ctx, this._ctx, found, this._rules[i]);
            this._rules[i].action.call(this._ctx, this._ctx, found);
            if (this._after !== null) this._after.call(this._ctx, this._ctx, found, this._rules[i]);
            if (this._ctx._reject) /*  reject current action, continue matching  */
              continue;else if (this._ctx._repeat) {
              /*  repeat matching from scratch  */
              continued = true;
              break;
            } else if (this._ctx._ignore) {
              /*  ignore token  */
              this._progress(this._pos, this._rules[i].pattern.lastIndex);
              this._pos = this._rules[i].pattern.lastIndex;
              if (this._pos >= this._len) {
                finish();
                return;
              }
              continued = true;
              break;
            } else if (this._pending.length > 0) {
              /*  accept token(s)  */
              this._progress(this._pos, this._rules[i].pattern.lastIndex);
              this._pos = this._rules[i].pattern.lastIndex;
              if (this._pos >= this._len) finish();
              return;
            } else throw new Error("action of pattern \"" + this._rules[i].pattern.source + "\" neither rejected nor accepted any token(s)");
          }
        }
      }

      /*  no pattern matched at all  */
      throw this.error("token not recognized");
    }

    /*  determine and return next token  */
  }, {
    key: "token",
    value: function token() {
      /*  if no more tokens are pending, try to determine a new one  */
      if (this._pending.length === 0) this._tokenize();

      /*  return now potentially pending token  */
      if (this._pending.length > 0) {
        var _token = this._pending.shift();
        if (this._transaction.length > 0) this._transaction[0].push(_token);
        this._log("TOKEN: ".concat(_token.toString()));
        return _token;
      }

      /*  no more tokens  */
      return null;
    }

    /*  determine and return all tokens  */
  }, {
    key: "tokens",
    value: function tokens() {
      var result = [];
      var token;
      while ((token = this.token()) !== null) result.push(token);
      return result;
    }

    /*  peek at the next token or token at particular offset  */
  }, {
    key: "peek",
    value: function peek(offset) {
      if (typeof offset === "undefined") offset = 0;

      /*  if no more tokens are pending, try to determine new ones  */
      if (offset >= this._pending.length) {
        if (this._pending.length === 0) this._tokenize();
        for (var i = 0; i < offset - this._pending.length; i++) this._tokenize();
      }
      if (offset >= this._pending.length) throw new Error("not enough tokens available for peek operation");
      this._log("PEEK: ".concat(this._pending[offset].toString()));
      return this._pending[offset];
    }

    /*  skip one or more tokens  */
  }, {
    key: "skip",
    value: function skip(len) {
      if (typeof len === "undefined") len = 1;
      for (var i = 0; i < this._pending.length + len; i++) this._tokenize();
      if (len > this._pending.length) throw new Error("not enough tokens available for skip operation");
      while (len-- > 0) this.token();
      return this;
    }

    /*  consume the current token (by expecting it to be a particular symbol)  */
  }, {
    key: "consume",
    value: function consume(type, value) {
      var _this3 = this;
      for (var i = 0; i < this._pending.length + 1; i++) this._tokenize();
      if (this._pending.length === 0) throw new Error("not enough tokens available for consume operation");
      var token = this.token();
      this._log("CONSUME: ".concat(token.toString()));
      var raiseError = function raiseError() {
        throw new ParsingError("expected: <type: ".concat(type, ", value: ").concat(JSON.stringify(value), " (").concat(_typeof(value), ")>, ") + "found: <type: ".concat(token.type, ", value: ").concat(JSON.stringify(token.value), " (").concat(_typeof(token.value), ")>"), token.pos, token.line, token.column, _this3._input);
      };
      if (arguments.length === 2 && !token.isA(type, value)) raiseError(JSON.stringify(value), _typeof(value));else if (!token.isA(type)) raiseError("*", "any");
      return token;
    }

    /*  open tokenization transaction  */
  }, {
    key: "begin",
    value: function begin() {
      this._log("BEGIN: level ".concat(this._transaction.length));
      this._transaction.unshift([]);
      return this;
    }

    /*  determine depth of still open tokenization transaction  */
  }, {
    key: "depth",
    value: function depth() {
      if (this._transaction.length === 0) throw new Error("cannot determine depth -- no active transaction");
      return this._transaction[0].length;
    }

    /*  close (successfully) tokenization transaction  */
  }, {
    key: "commit",
    value: function commit() {
      if (this._transaction.length === 0) throw new Error("cannot commit transaction -- no active transaction");

      /*  remove current transaction  */
      var committed = this._transaction.shift();

      /*  in case we were a nested transaction, still remember the tokens  */
      if (this._transaction.length > 0) this._transaction[0] = this._transaction[0].concat(committed);
      this._log("COMMIT: level ".concat(this._transaction.length));
      return this;
    }

    /*  close (unsuccessfully) tokenization transaction  */
  }, {
    key: "rollback",
    value: function rollback() {
      if (this._transaction.length === 0) throw new Error("cannot rollback transaction -- no active transaction");

      /*  remove current transaction  */
      var rolledback = this._transaction.shift();

      /*  make the tokens available again, as new pending tokens  */
      this._pending = rolledback.concat(this._pending);
      this._log("ROLLBACK: level ".concat(this._transaction.length));
      return this;
    }

    /*  execute multiple alternative callbacks  */
  }, {
    key: "alternatives",
    value: function alternatives() {
      var result = null;
      var depths = [];
      for (var _len = arguments.length, _alternatives = new Array(_len), _key = 0; _key < _len; _key++) {
        _alternatives[_key] = arguments[_key];
      }
      for (var i = 0; i < _alternatives.length; i++) {
        try {
          this.begin();
          result = _alternatives[i].call(this);
          this.commit();
          break;
        } catch (ex) {
          this._log("EXCEPTION: ".concat(ex.toString()));
          depths.push({
            ex: ex,
            depth: this.depth()
          });
          this.rollback();
          continue;
        }
      }
      if (result === null && depths.length > 0) {
        depths = depths.sort(function (a, b) {
          return a.depth - b.depth;
        });
        throw depths[0].ex;
      }
      return result;
    }
  }]);
}();
/*  expose the utility classes, too  */
Tokenizr.Token = Token;
Tokenizr.ParsingError = ParsingError;
Tokenizr.ActionContext = ActionContext;

/*  export the API class  */
module.exports = Tokenizr;

},{}]},{},[1])(1)
});
