var d3 = require('d3')
  
module.exports = function once(g, selector, data, before, key) {
  var g       = g.node ? g : d3.select(g)
    , classed = selector instanceof HTMLElement
                  ? selector.className
                  : selector.split('.').slice(1).join(' ')
    , type    = selector instanceof HTMLElement
                  ? function(){ return selector }
                  : selector.split('.')[0] || 'div'
    
  var el = g
    .selectAll(selector.toString())
    .data(data || [0], key)

  el.once = function(s,d,b,k) { return once.apply(el,s,d,b,k) }

  el.out = el.exit()
    .remove() 

  el.in = el.enter()
    .insert(type, before)
    .classed(classed, 1)

  return el
}
