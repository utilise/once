var emitterify = require('utilise.emitterify')  
  , deep = require('utilise.key')  

module.exports = once

function once(nodes, enter, exit) {
  c.__proto__ = once.prototype
  c.constructor = once
  c._enter = enter
  c._exit  = exit
  c.nodes = Array === nodes.constructor ? nodes
          : 'string' === typeof nodes ? document.querySelectorAll(nodes)
          : [nodes]

  var p = c.nodes.length
  while (p-- > 0) if (!c.nodes[p].evented) event(c.nodes[p])

  return c

  function c(s, d, k, b) {
    var lpar = c.nodes.length
      , p = lpar + 1
      , selector
      , data
      , tnodes = []
      , tenter = []
      , texit  = []

    if (arguments.length === 1) {
      if ('string' !== typeof s) return new once(s)

      while (--p > 0) 
        tnodes = tnodes.concat(Array.prototype.slice.call(c.nodes[lpar - p].querySelectorAll(s),0))

      return new once(tnodes)
    }

    while (--p > 0) {
      selector = 'function' === typeof s ? s(c.nodes[lpar - p].__data__) : s
      data     = 'function' === typeof d ? d(c.nodes[lpar - p].__data__) : d

      if (data === 1)                 data = c.nodes[lpar - p].__data__ || [1]
      if ('string'   === typeof data) data = [data]
      if (!data)                      data = []
      if (data.constructor !== Array) data = [data]

      var current = []
        , child
        , l = -1

      while (child = c.nodes[lpar - p].children[++l])
        if (child.matches(selector)) current[current.length] = child

      var lcur  = current.length
        , lnod  = data.length
        , nodes = new Array(lnod)
        , x     = lnod
        , y     = lcur
        , j     = 0

      while (x-- > 0) {
        l = lnod - x - 1
        if (l < lcur) nodes[l] = current[l]
        else {

          var tag = selector.call ? selector(data[l], l)
                  : /([^\.\[]*)/.exec(selector)[1] || 'div'

          b ? c.nodes[lpar - p].insertBefore(nodes[l] = tenter[tenter.length] = document.createElement(tag), c.nodes[lpar - p].querySelector(b))
            : c.nodes[lpar - p].appendChild(nodes[l] = tenter[tenter.length] = document.createElement(tag))

          var attrs = [], css = []

          selector
            .toString()
            .replace(/\[(.+?)="(.*?)"\]/g, function($1, $2, $3){ return attrs[attrs.length] = [$2, $3], '' })
            .replace(/\.([^.]+)/g, function($1, $2){ return css[css.length] = $2, ''})

          for (j = 0; j < attrs.length; j++) 
            nodes[l].setAttribute(attrs[j][0], attrs[j][1])

          for (j = 0; j < css.length; j++) 
            nodes[l].classList.add(css[j])
        }

        nodes[l].__data__ = data[l]
        tnodes[tnodes.length] = nodes[l]

        if ('function' === typeof nodes[l].draw) nodes[l].draw()
      }

      while (y-- > lnod)
        c.nodes[lpar - p].removeChild(texit[texit.length] = current[y])
    }

    return new once(tnodes, tenter, texit)
  }
}

once.prototype = {
  __proto__: Function.prototype
, nodes: []
, _enter: []
, _exit:  []
, node: function() {
    return this.nodes[0]
  }
, enter: function(){
    return once(this._enter)
  }
, exit: function() {
    return once(this._exit)
  }
, text: function(value){ 
    var fn = 'function' === typeof value
    return arguments.length === 0 ? this.nodes[0].textContent : (this.each(function(d){
      var r = '' + (fn ? value.call(this, d) : value), t
      if (this.textContent !== r) 
        !(t = this.firstChild) ? this.appendChild(document.createTextNode(r))
        : t.nodeName === '#text' ? t.nodeValue = r
        : this.textContent = r
    }), this)
  }
, html: function(value){
    var fn = 'function' === typeof value
    return arguments.length === 0 ? this.nodes[0].innerHTML : (this.each(function(d){
      var r = '' + (fn ? value.call(this, d) : value), t
      if (this.innerHTML !== r) this.innerHTML = r
    }), this)
  }
, attr: function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? this.nodes[0].getAttribute(key) : (this.each(function(d){
      var r = fn ? value.call(this, d) : value
           if (!r && this.hasAttribute(key)) this.removeAttribute(key)
      else if ( r && this.getAttribute(key) !== r) this.setAttribute(key, r)
    }), this) 
  }
, classed: function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? this.nodes[0].classList.contains(key) : (this.each(function(d){
      var r = fn ? value.call(this, d) : value
           if ( r && !this.classList.contains(key)) this.classList.add(key)
      else if (!r &&  this.classList.contains(key)) this.classList.remove(key)
    }), this) 
  }
, property: function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? deep(key)(this.nodes[0]) : (this.each(function(d){
      var r = fn ? value.call(this, d) : value
      if (r !== undefined && deep(key)(this) !== r) deep(key, function(){ return r })(this)
    }), this) 
  }
, each: function(fn){
    var i = 0; while(node = this.nodes[i++])
      fn.call(node, node.__data__, i)
    return this
  }
, remove: function(){
    this.each(function(d){
      this.parentNode.removeChild(this)
    }) 
    return this
  }
, draw: proxy('draw')
, on  : proxy('on')
, once: proxy('once')
, emit: proxy('emit')
}

function proxy(fn) {
  return function(){
    var args = arguments
    this.each(function(d){
      this[fn] && this[fn].apply(this, args)
    }) 
    return this 
  }
}

function event(node) {
  if (!node.on) emitterify(node)
  var on = node.on
    , emit = node.emit

  node.evented = true

  node.on = function(type) {
    node.addEventListener(type.split('.').shift(), reemit)
    on.apply(node, arguments)
    return node
  }

  node.emit = function(type, detail, p) {
    var params = p || { detail: detail, bubbles: false, cancelable: false }
    ;(node.host || node).dispatchEvent(new window.CustomEvent(type, params))
    return node
  }

  function reemit(event){
    if ('object' === typeof window.d3) window.d3.event = event
    emit(event.type, (event instanceof window.CustomEvent && event.detail) || this.__data__)
  }
}