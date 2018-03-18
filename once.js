(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.once = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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
  while (p-- > 0) if (!n[p].on) event(n[p], p)

  c.node  = function() { return n[0] }
  c.enter = function() { return once(enter) }
  c.exit  = function() { return once(exit) }
  c.size  = function() { return n.length }

  c.text  = function(value){ 
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].textContent : (this.each(function(n, d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.textContent !== r) 
        !(t = this.firstChild) ? this.appendChild(document.createTextNode(r))
        : t.nodeName === '#text' ? t.nodeValue = r
        : this.textContent = r
    }), this)
  }
  c.html = function(value){
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].innerHTML : (this.each(function(n, d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.innerHTML !== r) this.innerHTML = r
    }), this)
  }
  c.attr = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].getAttribute(key) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
           if (!r && this.hasAttribute(key)) this.removeAttribute(key)
      else if ( r && this.getAttribute(key) !== r) this.setAttribute(key, r)
    }), this) 
  }
  c.classed = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].classList.contains(key) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
           if ( r && !this.classList.contains(key)) this.classList.add(key)
      else if (!r &&  this.classList.contains(key)) this.classList.remove(key)
    }), this) 
  }
  c.property = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? deep(key)(n[0]) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
      if (r !== undefined && deep(key)(this) !== r) deep(key, function(){ return r })(this)
    }), this) 
  }
  c.each = function(fn){
    p = -1; while(n[++p])
      fn.call(n[p], n[p], n[p].state, p)
    return this
  }
  c.remove = function(){
    this.each(function(){
      var el = this.host && this.host.nodeName ? this.host : this
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
        selector = s.call ? s(n[p].state || 1, 0) : s
        while (n[p].children[--j])  {
          if (n[p].children[j].matches(selector)) {
            (tnodes[++t] = n[p].children[j]).state = n[p].state || 1
            break
          }
        }

        if (j < 0) n[p].appendChild(tnodes[++t] = tenter[tenter.length] = create(selector, [n[p].state || 1], 0))
        if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
      }

      return once(tnodes, tenter, texit)
    }

    // main loop
    while (n[++p]) {
      selector = 'function' === typeof s ? s(n[p].state) : s
      data     = 'function' === typeof d ? d(n[p].state) : d
      
      if (d === 1)                    data = n[p].state || [1]
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

        (tnodes[++t] = n[p].children[j]).state = data[l] // update
        if ('function' === typeof n[p].children[j].draw) n[p].children[j].draw()
      }

      // enter
      if (typeof selector === 'string') { 
        n[p].templates = n[p].templates || {}
        n[p].templates[selector] = n[p].templates[selector] || create(selector, [], 0)
        while (++l < data.length) { 
          (b ? n[p].insertBefore(tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false), n[p].querySelector(b)) 
             : n[p].appendChild( tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false)))
             .state = data[l]
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

// TODO: factor out - need to fix nbuild / non-utilise deps
function event(node) {
  // node = node.host && node.host.nodeName ? node.host : node
  if (node.on) return
  node.listeners = {}

  const on = o => {
    const type = o.type.split('.').shift()
    if (!node.listeners[type])
      node.addEventListener(type, node.listeners[type] = 
        event => (!event.detail || !event.detail.emitted ? emit(type, event) : 0)
      )
  }

  const off = o => {
    if (!node.on[o.type].length) {
      node.removeEventListener(o.type, node.listeners[o.type])
      delete node.listeners[o.type]
    }
  }

  emitterify(node, { on, off })
  const { emit } = node

  node.emit = function(type, params){
    const detail = { params, emitted: true }
        , event = new CustomEvent(type, { detail, bubbles: false, cancelable: true })
    node.dispatchEvent(event)
    return emit(type, event)
  }
}

function proxy(fn, c) {
  return function(){
    var args = arguments
    c.each(function(){
      var node = this.host && this.host.nodeName ? this.host : this
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

  node.state = d[j] || 1
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
    else indexNodes[key(parent.children[c].state)] = parent.children[c]

  next = b ? parent.querySelector(b) : null

  while (d--) {
    if (child = indexNodes[k = key(data[d])])
      if (child === true) continue
      else child.state = data[d]
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
},{"utilise.emitterify":3,"utilise.key":7,"utilise.keys":8}],2:[function(require,module,exports){
var has = require('utilise.has')

module.exports = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host
  if (p.name) v = p, p = p.name
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"utilise.has":5}],3:[function(require,module,exports){
var promise = require('utilise.promise')
  , flatten = require('utilise.flatten')
  , def     = require('utilise.def')
  , noop = function(){}

module.exports = function emitterify(body, hooks) {
  body = body || {}
  hooks = hooks || {}
  def(body, 'emit', emit, 1)
  def(body, 'once', once, 1)
  def(body, 'off', off, 1)
  def(body, 'on', on, 1)
  body.on['*'] = body.on['*'] || []
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = []

    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm))

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]))

    return results.reduce(flatten, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce
      cb.type = id
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb
      li.push(cb)
      ;(hooks.on || noop)(cb)
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length
    while (~--i) 
      if (cb == li[i] || cb == li[i].fn || !cb)
        (hooks.off || noop)(li.splice(i, 1)[0])
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb)
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns]
    return body
  }

  function observable(parent, opts) {
    opts = opts || {}
    var o = emitterify(opts.base || promise())
    o.i = 0
    o.li = []
    o.fn = opts.fn
    o.parent = parent
    o.source = opts.fn ? o.parent.source : o
    
    o.on('stop', function(reason){
      o.type
        ? o.parent.off(o.type, o)
        : o.parent.off(o)
      return o.reason = reason
    })

    o.each = function(fn) {
      var n = fn.next ? fn : observable(o, { fn: fn })
      o.li.push(n)
      return n
    }

    o.pipe = function(fn) {
      return fn(o)
    }

    o.map = function(fn){
      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
    }

    o.filter = function(fn){
      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
    }

    o.reduce = function(fn, acc) {
      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
    }

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } })
      o.li.push(n)
      return n
    }

    o.next = function(value) {
      o.resolve && o.resolve(value)
      return o.li.length 
           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
           : value
    }

    o.until = function(stop){
      (stop.each || stop.then).call(stop, function(reason){ return o.source.emit('stop', reason) })
      return o
    }

    o.off = function(fn){
      return remove(o.li, fn), o
    }

    o.start = function(fn){
      o.source.emit('start')
      return o
    }

    o[Symbol.asyncIterator] = function(){ 
      return { 
        next: function(){ 
          return o.wait = new Promise(function(resolve){
            o.wait = true
            o.map(function(d, i, n){
              delete o.wait
              o.off(n)
              resolve({ value: d, done: false })
            })
            o.emit('pull', o)
          })
        }
      }
    }

    return o
  }
}
},{"utilise.def":2,"utilise.flatten":4,"utilise.promise":9}],4:[function(require,module,exports){
module.exports = function flatten(p,v){ 
  if (v instanceof Array) v = v.reduce(flatten, [])
  return (p = p || []), p.concat(v) 
}

},{}],5:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],6:[function(require,module,exports){
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
    return  set.indexOf 
         ? ~set.indexOf(d)
         :  d in set
  }
}
},{}],7:[function(require,module,exports){
var wrap = require('utilise.wrap')
  , dir = require('utilise.keys')
  , str = require('utilise.str')
  , is = require('utilise.is')

module.exports = function key(k, v){ 
  var set = arguments.length > 1
    , keys = is.fn(k) ? [] : str(k).split('.').filter(Boolean)
    , root = keys.shift()

  return function deep(o, i){
    var masked = {}
    
    return !o ? undefined 
         : !is.num(k) && !k ? (set ? replace(o, v) : o)
         : is.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys.length ? (set ? ((o[k] = is.fn(v) ? v(o[k], i) : v), o)
                                       :  (is.fn(k) ? k(o) : o[k]))
                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       :  key(keys.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o)
      val = is.fn(v)       ? v(val) 
          : val == undefined ? v
                           : val
    if (val != undefined) 
        key(k, is.fn(val) ? wrap(val) : val)(masked)
    }

    function replace(o, v) {
      dir(o).map(function(k){ delete o[k] })
      dir(v).map(function(k){ o[k] = v[k] })
      return o
    }
  }
}
},{"utilise.is":6,"utilise.keys":8,"utilise.str":10,"utilise.wrap":11}],8:[function(require,module,exports){
var is = require('utilise.is')

module.exports = function keys(o) { 
  return Object.keys(is.obj(o) || is.fn(o) ? o : {})
}
},{"utilise.is":6}],9:[function(require,module,exports){
module.exports = promise

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej
      })

  arguments.length && resolve(arguments[0])
  p.resolve = resolve
  p.reject  = reject
  return p
}
},{}],10:[function(require,module,exports){
var is = require('utilise.is') 

module.exports = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is.fn(d) ? '' + d
       : is.obj(d) ? JSON.stringify(d)
       : String(d)
}
},{"utilise.is":6}],11:[function(require,module,exports){
module.exports = function wrap(d){
  return function(){
    return d
  }
}
},{}]},{},[1])(1)
});
