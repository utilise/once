(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.once = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var emitterify = require('utilise.emitterify')  
  , keys = require('utilise.keys')
  , key = require('utilise.key')
  , deep = key
  , rsplit = /([^\.\[]*)/

module.exports = once

function once(nodes, enter, exit) {
  var n = c.nodes = Array === nodes.constructor ? nodes
        : 'string' === typeof nodes ? document.querySelectorAll(nodes)
        : [nodes]

  var p = n.length
  while (p-- > 0) if (!n[p].evented) event(n[p], p)

  c.node  = function() { return n[0] }
  c.enter = function() { return once(enter) }
  c.exit  = function() { return once(exit) }
  c.size  = function() { return n.length }

  c.text  = function(value){ 
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].textContent : (this.each(function(d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.textContent !== r) 
        !(t = this.firstChild) ? this.appendChild(document.createTextNode(r))
        : t.nodeName === '#text' ? t.nodeValue = r
        : this.textContent = r
    }), this)
  }
  c.html = function(value){
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].innerHTML : (this.each(function(d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.innerHTML !== r) this.innerHTML = r
    }), this)
  }
  c.attr = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].getAttribute(key) : (this.each(function(d, i){
      var r = fn ? value.call(this, d, i) : value
           if (!r && this.hasAttribute(key)) this.removeAttribute(key)
      else if ( r && this.getAttribute(key) !== r) this.setAttribute(key, r)
    }), this) 
  }
  c.classed = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].classList.contains(key) : (this.each(function(d, i){
      var r = fn ? value.call(this, d, i) : value
           if ( r && !this.classList.contains(key)) this.classList.add(key)
      else if (!r &&  this.classList.contains(key)) this.classList.remove(key)
    }), this) 
  }
  c.property = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? deep(key)(n[0]) : (this.each(function(d, i){
      var r = fn ? value.call(this, d, i) : value
      if (r !== undefined && deep(key)(this) !== r) deep(key, function(){ return r })(this)
    }), this) 
  }
  c.each = function(fn){
    p = -1; while(n[++p])
      fn.call(n[p], n[p], n[p].__data__, p)
    return this
  }
  c.remove = function(){
    this.each(function(d){
      var el = this.host || this
      el.parentNode.removeChild(el)
    }) 
    return this
  }  
  c.closest = function(tag){ 
    return once(n
      .map(function(d){ return d.closest(tag) })
      .filter(Boolean))
  }
  c.draw = proxy('draw', c)
  c.once = proxy('once', c)
  c.emit = proxy('emit', c)
  c.on   = proxy('on', c)

  return c
  
  function c(s, d, k, b) {
    var selector
      , data
      , tnodes = []
      , tenter = []
      , texit  = []
      , j = -1
      , p = -1
      , l = -1
      , t = -1

    // reselect
    if (arguments.length === 1) {
      if ('string' !== typeof s) return once(s)

      while (n[++p]) 
        tnodes = tnodes.concat(Array.prototype.slice.call(n[p].querySelectorAll(s), 0))

      return once(tnodes)
    }

    // shortcut
    if (d === 1 && arguments.length == 2) {
      while (n[++p]) { 
        j = n[p].children.length
        selector = s.call ? s(n[p].__data__ || 1, 0) : s
        while (n[p].children[--j])  {
          if (n[p].children[j].matches(selector)) {
            (tnodes[++t] = n[p].children[j]).__data__ = n[p].__data__ || 1
            break
          }
        }

        if (j < 0) n[p].appendChild(tnodes[++t] = tenter[tenter.length] = create(selector, [n[p].__data__ || 1], 0))
        if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
      }

      return once(tnodes, tenter, texit)
    }

    // main loop
    while (n[++p]) {
      selector = 'function' === typeof s ? s(n[p].__data__) : s
      data     = 'function' === typeof d ? d(n[p].__data__) : d
      
      if (d === 1)                    data = n[p].__data__ || [1]
      if ('string' === typeof data)   data = [data]
      if (!data)                      data = []
      if (data.constructor !== Array) data = [data]
      
      if (k) {
        byKey(selector, data, k, b, n[p], tnodes, tenter, texit)
        continue
      }

      l = -1
      j = -1

      while (n[p].children[++j]) { 
        if (!n[p].children[j].matches(selector)) continue
        if (++l >= data.length) { // exit
          n[p].removeChild(texit[texit.length] = n[p].children[j]), --j
          continue 
        }

        (tnodes[++t] = n[p].children[j]).__data__ = data[l] // update
        if ('function' === typeof n[p].children[j].draw) n[p].children[j].draw()
      }

      // enter
      if (typeof selector === 'string') { 
        n[p].templates = n[p].templates || {}
        n[p].templates[selector] = n[p].templates[selector] || create(selector, [], 0)
        while (++l < data.length) { 
          (b ? n[p].insertBefore(tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false), n[p].querySelector(b)) 
             : n[p].appendChild( tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false)))
             .__data__ = data[l]
          if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
        }
      } else {
        while (++l < data.length) { 
          (b ? n[p].insertBefore(tnodes[++t] = tenter[tenter.length] = create(selector, data, l), n[p].querySelector(b)) 
             : n[p].appendChild( tnodes[++t] = tenter[tenter.length] = create(selector, data, l)))
          if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
        }
      }
    }
  
    return once(tnodes, tenter, texit)
  }

}

function event(node, index) {
  node = node.host && node.host.nodeName ? node.host : node
  if (node.evented) return
  if (!node.on) emitterify(node)
  var on = node.on
    , emit = node.emit
    , old = keys(node.on)

  node.evented = true

  node.on = function(type) {
    node.addEventListener(type.split('.').shift(), reemit)
    on.apply(node, arguments)
    return node
  }

  node.emit = function(event, detail) {
    node.dispatchEvent(event instanceof window.Event 
      ? event
      : new window.CustomEvent(event, { detail: detail, bubbles: false, cancelable: true }))
    return node
  }

  old.map(function(event){
    node.on[event] = on[event]
    node.on(event)
  })

  function reemit(event){
    if ('object' === typeof window.d3) window.d3.event = event
    emit(event.type, [this.__data__, index, this, event])
  }
}

function proxy(fn, c) {
  return function(){
    var args = arguments
    c.each(function(){
      var node = this.host || this
      node[fn] && node[fn].apply(node, args)
    }) 
    return c 
  }
}

function create(s, d, j) {
  var i     = 0
    , attrs = []
    , css   = []
    , sel   = s.call ? s(d[j], j) : s
    , tag   = rsplit.exec(sel)[1] || 'div'
    , node  = document.createElement(tag)

  ;(s.call ? s.toString() : s)
    .replace(/\[(.+?)="(.*?)"\]/g, function($1, $2, $3){ return attrs[attrs.length] = [$2, $3], '' })
    .replace(/\.([^.]+)/g, function($1, $2){ return css[css.length] = $2, ''})

  for (i = 0; i < attrs.length; i++) 
    node.setAttribute(attrs[i][0], attrs[i][1])

  for (i = 0; i < css.length; i++) 
    node.classList.add(css[i])

  node.__data__ = d[j] || 1
  return node
}

function byKey(selector, data, key, b, parent, tnodes, tenter, texit) {
  var c = -1
    , d = data.length
    , k
    , indexNodes = {}
    , child
    , next

  while (parent.children[++c]) 
    if (!parent.children[c].matches(selector)) continue
    else indexNodes[key(parent.children[c].__data__)] = parent.children[c]

  next = b ? parent.querySelector(b) : null

  while (d--) {
    if (child = indexNodes[k = key(data[d])])
      if (child === true) continue
      else child.__data__ = data[d]
    else
      tenter.unshift(child = create(selector, data, d))
    
    indexNodes[k] = true

    if (d == data.length - 1 || next !== child.nextSibling)
      parent.insertBefore(child, next)

    tnodes.unshift(next = child)
    if ('function' === typeof child.draw) child.draw()
  }

  for (c in indexNodes)
    if (indexNodes[c] !== true)
      texit.unshift(parent.removeChild(indexNodes[c]))
}
},{"utilise.emitterify":4,"utilise.key":8,"utilise.keys":9}],2:[function(require,module,exports){
module.exports = typeof window != 'undefined'
},{}],3:[function(require,module,exports){
var has = require('utilise.has')

module.exports = function def(o, p, v, w){
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"utilise.has":6}],4:[function(require,module,exports){
var err  = require('utilise.err')('[emitterify]')
  , keys = require('utilise.keys')
  , def  = require('utilise.def')
  , not  = require('utilise.not')
  , is   = require('utilise.is')
  
module.exports = function emitterify(body, dparam) {
  return def(body, 'emit', emit, 1)
       , def(body, 'once', once, 1)
       , def(body, 'on', on, 1)
       , body

  function emit(type, param, filter) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]
      , li = body.on[id] || []
      , tt = li.length - 1
      , tp = is.def(param)  ? param 
           : is.def(dparam) ? dparam
           : [body]
      , pm = is.arr(tp) ? tp : [tp]

    if (ns) return invoke(li, ns, pm), body

    for (var i = li.length; i >=0; i--)
      invoke(li, i, pm)

    keys(li)
      .filter(not(isFinite))
      .filter(filter || Boolean)
      .map(function(n){ return invoke(li, n, pm) })

    return body
  }

  function invoke(o, k, p){
    if (!o[k]) return
    var fn = o[k]
    o[k].once && (isFinite(k) ? o.splice(k, 1) : delete o[k])
    try { fn.apply(body, p) } catch(e) { err(e, e.stack)  }
   }

  function on(type, callback) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]

    body.on[id] = body.on[id] || []
    return !callback && !ns ? (body.on[id])
         : !callback &&  ns ? (body.on[id][ns])
         :  ns              ? (body.on[id][ns] = callback, body)
                            : (body.on[id].push(callback), body)
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback), body
  }
}
},{"utilise.def":3,"utilise.err":5,"utilise.is":7,"utilise.keys":9,"utilise.not":10}],5:[function(require,module,exports){
var owner = require('utilise.owner')
  , to = require('utilise.to')

module.exports = function err(prefix){
  return function(d){
    if (!owner.console || !console.error.apply) return d;
    var args = to.arr(arguments)
    args.unshift(prefix.red ? prefix.red : prefix)
    return console.error.apply(console, args), d
  }
}
},{"utilise.owner":11,"utilise.to":13}],6:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],7:[function(require,module,exports){
module.exports = is
is.fn     = isFunction
is.str    = isString
is.num    = isNumber
is.obj    = isObject
is.lit    = isLiteral
is.bol    = isBoolean
is.truthy = isTruthy
is.falsy  = isFalsy
is.arr    = isArray
is.null   = isNull
is.def    = isDef
is.in     = isIn

function is(v){
  return function(d){
    return d == v
  }
}

function isFunction(d) {
  return typeof d == 'function'
}

function isBoolean(d) {
  return typeof d == 'boolean'
}

function isString(d) {
  return typeof d == 'string'
}

function isNumber(d) {
  return typeof d == 'number'
}

function isObject(d) {
  return typeof d == 'object'
}

function isLiteral(d) {
  return typeof d == 'object' 
      && !(d instanceof Array)
}

function isTruthy(d) {
  return !!d == true
}

function isFalsy(d) {
  return !!d == false
}

function isArray(d) {
  return d instanceof Array
}

function isNull(d) {
  return d === null
}

function isDef(d) {
  return typeof d !== 'undefined'
}

function isIn(set) {
  return function(d){
    return !set ? false  
         : set.indexOf ? ~set.indexOf(d)
         : d in set
  }
}
},{}],8:[function(require,module,exports){
var str = require('utilise.str')
  , is = require('utilise.is')

module.exports = function key(k, v){ 
  var set = arguments.length > 1
    , keys = is.fn(k) ? [] : str(k).split('.')
    , root = keys.shift()

  return function deep(o, i){
    var masked = {}
    
    return !o ? undefined 
         : !is.num(k) && !k ? o
         : is.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys.length ? (set ? ((o[k] = is.fn(v) ? v(o[k], i) : v), o)
                                       :  (is.fn(k) ? k(o) : o[k]))
                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       :  key(keys.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o)
      ;(val != undefined) && key(k, val)(masked)
    }
  }
}
},{"utilise.is":7,"utilise.str":12}],9:[function(require,module,exports){
module.exports = function keys(o) {
  return Object.keys(o || {})
}
},{}],10:[function(require,module,exports){
module.exports = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}
},{}],11:[function(require,module,exports){
(function (global){
module.exports = require('utilise.client') ? /* istanbul ignore next */ window : global
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"utilise.client":2}],12:[function(require,module,exports){
var is = require('utilise.is') 

module.exports = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is.fn(d) ? '' + d
       : is.obj(d) ? JSON.stringify(d)
       : String(d)
}
},{"utilise.is":7}],13:[function(require,module,exports){
module.exports = { 
  arr: toArray
, obj: toObject
}

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

function toObject(d) {
  var by = 'id'
    , o = {}

  return arguments.length == 1 
    ? (by = d, reduce)
    : reduce.apply(this, arguments)

  function reduce(p,v,i){
    if (i === 0) p = {}
    p[v[by]] = v
    return p
  }
}
},{}]},{},[1])(1)
});