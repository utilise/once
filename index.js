var d3 = require('d3')
  , is = require('is')  

module.exports = function once(g, selector, data, before, key) {
  var g       = g.node ? g : d3.select(g)
    , classed = selector instanceof HTMLElement
                  ? selector.className
                  : selector.split('.').slice(1).join(' ')
    , type    = selector instanceof HTMLElement
                  ? function(){ return selector }
                  : selector.split('.')[0] || 'div'
    
  if (is.str(data)) (data = [data])
  if (is.obj(data) && !is.arr(data)) (data = [data])
  if (arguments.length == 2) data = [0]
  if (!data) data = []

  var el = g
    .selectAll(selector.toString())
    .data(data, key)

  el.once = function(s,d,b,k) { return once(el,s,d,b,k) }

  el.out = el.exit()
    .remove() 

  el.in = el.enter()
    .insert(type, before)
    .classed(classed, 1)

  return el
}
