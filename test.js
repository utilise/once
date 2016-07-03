var expect = require('chai').expect
  , client = require('utilise.client')
  , shim = !client && polyfill()
  , d3 = window.d3 = require('d3')
  , emitterify = require('utilise.emitterify')  
  , identity = require('utilise.identity')  
  , wrap = require('utilise.wrap')  
  , attr = require('utilise.attr')
  , time = require('utilise.time')
  , key = require('utilise.key')
  , to = require('utilise.to')
  , once = require('./')
  , node 

describe('once', function() {

  before(function(){
    /* istanbul ignore next */
    node = !client
      ? document.body.firstElementChild
      : document.body.appendChild(document.createElement('div'))
  })

  beforeEach(function(){
    node.innerHTML = ''
  })

  after(function(){
    document.body.removeChild(node)
  })

  it('should append only one div by default', function() {
    once(node)('.sth', 1)
    once(node)('.sth', 1)
    expect(node.innerHTML).to.be.eql('<div class="sth"></div>')
  })

  it('should append elements by data', function() {
    once(node)('li', [1,2,3])
    expect(node.innerHTML).to.be.eql('<li></li><li></li><li></li>')
  })

  it('should remove elements by data', function() {
    once(node)('li', [1,2,3,4,5])
    once(node)('li', [])
    expect(node.innerHTML).to.be.eql('')
  })

  // NOTE: enter/exit now functions
  it('should be able to extend enter/update/exit selection', function() {
    once(node)
      ('li', [1,2])
        .classed('sth', true)
        .text(String)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')

    once(node)
      ('li', [1,2,3])
        .enter()
        .classed('new', true)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li><li class="new"></li>')

    var out = once(node)
      ('li', [1,2])
        .exit()
        .node()
        .className

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')
    expect(out).to.be.eql('new')
  })

  it('should key elements by index by default', function() {
    once(node)('li', [{id:1},{id:2},{id:3}])
    once(node)('li', [{id:3},{id:2}])
    expect(node.innerHTML).to.be.eql('<li></li><li></li>')
  })

  it('should key elements', function() {
    var id = key('id')
      , t  = key('t')

    once(node)('li', [
      { id:1, t: 'a' }
    , { id:2, t: 'b' }
    , { id:3, t: 'c' }
    ], id).text(t)

    once(node)('li', [
      { id:3, t: 'd' }
    , { id:2, t: 'e' }
    ], id).text(t)

    expect(node.innerHTML).to.be.eql('<li>d</li><li>e</li>')
    expect(node.children[0].__data__.id).to.be.eql(3)
    expect(node.children[1].__data__.id).to.be.eql(2)
  })

  it('should insert before', function() {
    once(node)('li.B', 1)
    once(node)('li.A', 1, 0, '.B')
    expect(node.innerHTML).to.be.eql('<li class="A"></li><li class="B"></li>')
  })

  it('should select multiple parents', function() {
    once(node)('li', [1,2,3])
    once('li')('a', 1)
    expect(node.innerHTML).to.be.eql('<li><a></a></li><li><a></a></li><li><a></a></li>')
  })

  it('should be able to chain onces', function() {
    once(node)('li', [1, 2])
      .text(String)
        ('a', [3, 4])
        .html(String)
          ('span', [])

    expect(node.innerHTML).to.be.eql('<li>1<a>3</a><a>4</a></li><li>2<a>3</a><a>4</a></li>')
  })

  it('should set directly', function() {
    once(node).text('foo')
    expect(node.innerHTML).to.be.eql('foo')

    once(node).html('<li>bar</li>')
    expect(node.innerHTML).to.be.eql('<li>bar</li>')

    once(node)('li', 1).attr('foo', 'baz')
    expect(node.firstChild.getAttribute('foo')).to.be.eql('baz')
  })

  it('should not wipe children if existing text node', function() {
    once(node)
      .text('foo')
        ('li', 1)

    once(node)
      .text('bar')

    expect(node.innerHTML).to.be.eql('bar<li></li>')
  })

  it('should wipe children if no existing text node', function() {
    once(node)
      ('li', 1)

    once(node)
      .text('foo')

    expect(node.innerHTML).to.be.eql('foo')
  })

  it('should not touch prop if not necessary', function() {
    once(node).html('foo')
    expect(node.innerHTML).to.be.eql('foo')
    once(node).html('foo')

    once(node)('li', 1)

    once(node.lastChild).attr('foo', 'bar')
    expect(node.lastChild.getAttribute('foo')).to.be.eql('bar')
    once(node.lastChild).attr('foo', 'bar')
  })

  it('should remove class with falsy', function() {
    once(node)('li', 1)
    var o = once(node.lastChild)
    
    o.classed('foo', true)
    expect(node.lastChild.className).to.be.eql('foo')
    o.classed('foo', false)
    expect(node.lastChild.className).to.be.eql('')
    o.classed('foo', false)
    expect(node.lastChild.className).to.be.eql('')

  })

  it('should be able to chain scopes', function() {
    node.innerHTML = '<li><a></a></li>'
    once(node)('li')('a')
      ('i', [1,2])
        .text(String)

    expect(node.innerHTML).to.be.eql('<li><a><i>1</i><i>2</i></a></li>')
  })

  // NOTE: attr values now need to be quoted
  it('should be able to deal with tag, css and attrs', function() {
    once(node)('foo-bar.classA[attr="value"]', 1)
    once(node)('foo-bar.classA[attr="value"]', 1)
    expect(node.firstElementChild.tagName.toLowerCase()).to.be.eql('foo-bar')
    expect(node.firstElementChild.className).to.be.eql('classA')
    expect(attr(node.firstElementChild, 'attr')).to.be.eql('value')
    expect(node.firstElementChild.innerHTML).to.be.eql('')
  })

  // no longer necessary to use el
  // it('should clone real elements', function() {
  //   once(node)('foo-bar', [1,2,3])
  //   expect(node.childNodes.length).to.be.eql(3)
  // })

  it('should process function for data', function() {
    once(node)
      ('div', [{foo:'bar'}, {foo:'baz'}, {foo:'boo'}])
        ('li', key('foo'))
          .text(String)

    expect(node.innerHTML).to.be.eql('<div><li>bar</li></div><div><li>baz</li></div><div><li>boo</li></div>')
  })

  it('should treat string data as one element', function() {
    once(node)
      ('h1', 'abc')
        .text(String)

    expect(node.innerHTML).to.be.eql('<h1>abc</h1>')
  })

  it('should render empty string', function() {
    once(node)
      ('h1', '')
        .text(String)

    expect(node.innerHTML).to.be.eql('<h1></h1>')
  })

  it('should not render anything with undefined', function() {
    once(node)('li', undefined)
    expect(node.innerHTML).to.be.eql('')
  })

  it('should render with single object', function() {
    once(node)('li', { foo: 'bar' }).text(key('foo'))
    expect(node.innerHTML).to.be.eql('<li>bar</li>')
  })

  it('should not render any negatives', function() {
    once(node)('li', false)
    once(node)('li', 0)
    once(node)('li', '')
    once(node)('li', [])

    expect(node.innerHTML).to.be.eql('')
  })

  it('should render true as one el', function() {
    once(node)('li', true).text(String)
    expect(node.innerHTML).to.be.eql('<li>true</li>')
  })

  it('should render number as one el', function() {
    once(node)('li', 5).text(String)
    expect(node.innerHTML).to.be.eql('<li>5</li>')
  })

  it('should allow for conditional tagName', function() {
    once(node)
      ('li', [{ first:'foo', second: 'bar' }, { first:'baz', second: 'baz' }])
        (key('first'), 1)

    expect(node.innerHTML).to.be.eql('<li><foo></foo></li><li><baz></baz></li>')

    once(node)
      ('li')
        (key('second'), 1)

    expect(node.innerHTML).to.be.eql('<li><foo></foo><bar></bar></li><li><baz></baz></li>')
  })

  it('should inherit data', function() {
    once(node)
      ('ul', { foo:'bar' })
        ('li', identity)
          ('a', key('foo'))
            .text(String)
    
    expect(node.innerHTML).to.be.eql('<ul><li><a>bar</a></li></ul>')
  })

  it('should inherit data via shortcut', function() {
    once(node)
      ('ul', { foo: 'bar' })
        ('li', 1)
          ('a', key('foo'))
            .text(String)
    
    expect(node.innerHTML).to.be.eql('<ul><li><a>bar</a></li></ul>')
  })

  it('should have accessors on first scoping', function() {
    var o = once(node)
    expect(o['text']).to.be.a('function')
    expect(o['classed']).to.be.a('function')
    expect(o['html']).to.be.a('function')
    expect(o['attr']).to.be.a('function')
    // expect(o['style']).to.be.a('function')
    expect(o['on']).to.be.a('function')
    expect(o['each']).to.be.a('function')
    expect(o['node']).to.be.a('function')
    expect(o['property']).to.be.a('function')
  })

  it('should have accessors on subsequent operations', function() {
    var o = once(node)('li', 1)
    expect(o['text']).to.be.a('function')
    expect(o['classed']).to.be.a('function')
    expect(o['html']).to.be.a('function')
    expect(o['attr']).to.be.a('function')
    // expect(o['style']).to.be.a('function')
    expect(o['on']).to.be.a('function')
    expect(o['each']).to.be.a('function')
    expect(o['node']).to.be.a('function')
    expect(o['property']).to.be.a('function')
  })

  it('should not need > selector', function() {
    once(node)
      ('ul', 1)
        ('li', 1)
          .text(String)

    once(node)
      ('li', 1)
        .text(String)
          
    expect(node.innerHTML).to.be.eql('<ul><li>1</li></ul><li>1</li>')

    once(node)
      ('li', 2)
        .text(String)
          
    expect(node.innerHTML).to.be.eql('<ul><li>1</li></ul><li>2</li>')
  })

  it('should emitterify elements', function(){
    var o = once(node)('div', 1).on('foo', String)

    expect(o.on).to.be.ok
    expect(o.once).to.be.ok
    expect(o.emit).to.be.ok

    expect(node.on).to.be.ok
    expect(node.once).to.be.ok
    expect(node.emit).to.be.ok

    expect(node.firstChild.on).to.be.ok
    expect(node.firstChild.once).to.be.ok
    expect(node.firstChild.emit).to.be.ok
    expect(node.firstChild.on.foo).to.be.ok
  })

  it('should emitterify idempotently', function(){
    var o = once(node)('div', 1).on('foo', String)

    expect(node.firstChild.on.foo).to.be.ok
    once(node)('div')
    expect(node.firstChild.on.foo).to.be.ok
  })

  it('should emit custom events', function(){
    var o = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('synthetic', function(d, i, el, e){ result1 += e.detail })
    o.on('synthetic', function(d, i, el, e){ result2 += e.detail })
    
    // from selection
    result1 = result2 = 0
    o.emit('synthetic', 5)
    expect(result1).to.eql(5)
    expect(result2).to.eql(5)

    // from element
    result1 = result2 = 0
    node.firstChild.emit('synthetic', 2)
    expect(result1).to.eql(2)
    expect(result2).to.eql(2)
  })

  it('should emit custom events - with namespaces', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('synthetic.ns1', function(d, i, el, e){ result1 = e.detail })
    el.on('synthetic.ns2', function(d, i, el, e){ result2 = e.detail })
    
    // from selection
    result1 = result2 = undefined
    el.emit('synthetic', 5)
    expect(result1).to.eql(5)
    expect(result2).to.eql(5)

    // from element
    result1 = result2 = undefined
    node.firstChild.emit('synthetic', 7)
    expect(result1).to.eql(7)
    expect(result2).to.eql(7)
  })

  it('should emit dom events - on node', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('click', function(d, i, el, e){ result1 = e.detail })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(undefined)
  })

  it('should emit dom events - on o', function(){
    var el = once(node)('div', 1)
      , result1, result2

    el.on('click', function(d, i, el, e){ result2 = e.detail })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result2).to.eql(undefined)
  })

  it('should trigger non-namespaced custom events via emit', function(){
    var o = once(node)('div', 1)
      , result

    node.lastChild.addEventListener('click', function(e){ result = e.detail })
    o.emit('click', 5)
    expect(result).to.eql(5)
  })

  it('should emit dom events - with namespaces', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('click.ns1', function(d, i, el, e){ result1 = e.detail })
    el.on('click.ns2', function(d, i, el, e){ result2 = e.detail })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(undefined)
    expect(result2).to.eql(undefined)
  })

  it('should not add duplicate listeners', function(){
    var el = once(node)('div', 1)
      , result1 = 0, result2 = 0

    /* istanbul ignore next */
    ;( node.firstChild.on('click.ns1', function(d, i, el, e){ result1 += e.detail })
    , el.on('click.ns2', function(d, i, el, e){ result2 += e.detail })
    , node.firstChild.on('click.ns1', function(d, i, el, e){ result1 += e.detail })
    , el.on('click.ns2', function(d, i, el, e){ result2 += e.detail })
    , node.firstChild.on('click.ns1', function(d, i, el, e){ result1 += e.detail })
    , el.on('click.ns2', function(d, i, el, e){ result2 += e.detail })
    )
    
    var event = new window.CustomEvent('click', { detail: 1, bubbles: false, cancelable: false })
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(1)
    expect(result2).to.eql(1)
  })

  it('should be able to chain after event', function(){
    var el = once(node)('div', 1)
    expect(el.on('event', String)).to.eql(el)
    expect(el.emit('event')).to.eql(el)
    expect(el.node().on('event')).to.eql(el.node())
    expect(el.node().emit('event')).to.eql(el.node())
  })

  it('should set d3.event', function(done){
    var el = once(node)('div', 1)
      , i = -1
      , expects = function(){ 
          expect(d3.event).to.be.ok
          expect(d3.event.preventDefault).to.be.a('function')
          expect(d3.event.stopPropagation).to.be.a('function')
          ++i && done()
        }

    node.firstChild.on('click', expects)
    el.on('click', expects)

    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
  })

  it('should not set d3.event if no d3', function(done){
    var original = window.d3
    window.d3 = undefined

    var o = once(node)('div', 1)
    
    o.on('click', function(d, i, el, e){ 
      expect(e.detail).to.be.eql('foo')
      expect(window.d3).to.be.not.ok
      done()
    })
    o.emit('click', 'foo')

    window.d3 = original
  })

  it('should be able to access element data', function(done){
    var el = once(node)('div', { foo: 'bar' })
      , j = 0
      , expects = function(d, i, el, e){ 
          expect(this.__data__)
            .to.be.eql({ foo: 'bar' })
            .to.be.eql(d)
          if (++j == 4) done()
        }

    node.firstChild.on('click', expects)
    el.on('click', expects)

    el.emit('click')
    node.firstChild.emit('click')
  })
  
  it('should invoke draw if exists', function(){
    var result
    
    once(node)('div', { foo: 'bar' })
    node.firstChild.draw = function(){ result = true }
    expect(result).to.not.be.ok
    once(node)('div', { foo: 'bar' })
    expect(result).to.be.ok
  })

  it('should emit shadowroot on host', function(){
    node.innerHTML = "<li></li><span></span>"
    node.lastChild.host = node.firstChild

    var el = once(node)('li', 1)
      , sr = once(node)('span', 1)
      , result

    el.on('event.sr', function(d, i, el, e){ result = e.detail })

    result = undefined
    sr.emit('event', 'foo')
    expect(result).to.eql('foo')

    result = undefined
    el.emit('event', 'foo')
    expect(result).to.eql('foo')

    result = undefined
    node.firstChild.emit('event', 'bar')
    expect(result).to.eql('bar')
  })

  it('should return actual node via .node', function() {
    var o = once(node)('li', 1)
    expect(o.node()).to.be.eql(node.firstChild)
  })

  it('should remove node', function() {
    var o = once(node)('li', 1)
    expect(node.innerHTML).to.be.eql('<li></li>')
    o.remove()
    expect(node.innerHTML).to.be.eql('')
  })

  it('should remove host if shadow', function() {
    node.innerHTML = "<li></li><span></span>"
    node.lastChild.host = node.firstChild

    once(node)
      ('span')
        .remove()

    expect(node.innerHTML).to.be.eql('<span></span>')
  })

  it('should allow accessors as getters as usual too', function() {
    var o = once(node)('div', 'foo')
      .property('foo', String)
      .classed('foo', String)
      // .style('display', 'none')
      .attr('foo', String)
      .text(String)

    expect(o.text()).to.eql('foo')
    expect(o.html()).to.eql('foo')
    expect(o.classed('foo')).to.be.ok
    expect(o.classed('bar')).to.not.be.ok
    expect(o.attr('foo')).to.eql('foo')
    // expect(o.style('display')).to.eql('none')
    expect(o.property('foo')).to.eql('foo')
  })

  it('should allow .each', function() {
    var o = once(node)('div', ['foo', 'bar'])
      .each(function(d){ this.foo = d })
      .each(function(d){ this.foo = 'baz' })

    expect(node.childNodes[0].foo).to.eql('baz')
    expect(node.childNodes[1].foo).to.eql('baz')
  })

  // NOTE: Deprecated
  // it('should allow .datum', function() {
  //   var o = once(node)('div', 'foo')
  //     .datum('bar')
  //     .datum('baz')

  //   expect(node.childNodes[0].__data__).to.eql('baz')
  // })

  // NOTE: Deprecated
  // it('should allow .sel', function() {
  //   var o = once(node)('div', 'boo')
  //     .each(function(d){ this.foo = 'bar' })
  //     .sel
  //     .each(function(d){ this.foo = 'baz' })

  //   expect(node.childNodes[0].foo).to.eql('baz')

  //   var o = once(node)('div', 'foo')
  //     .datum('bar')
  //     .sel
  //     .each(function(d){ this.foo = d })

  //   expect(node.childNodes[0].foo).to.eql('bar')
  // })

  /* istanbul ignore next */
  it('should memoize accessors', function(done) {
    if (typeof MutationObserver == 'undefined') return done()
    if (~window.navigator.userAgent.indexOf('Trident')) return done() // strange muto error on ie

    var increment = function() { ++count }
      , conf = { attributes: true, characterData: true, subtree: true, childList: true }
      , muto = new MutationObserver(increment)
      , o = once(node)('div', 1)
      , count 

    muto.observe(o.node(), conf)

    // text
    time(0, function(){
      count = 0
      o.text('foo') })

    time(50, function(){
      expect(count).to.be.eql(1)
      o.text('foo') })

    time(100, function(){
      expect(o.text()).to.be.eql('foo')
      expect(count).to.be.eql(1) })

    // attr
    time(150, function(){
      count = 0
      o.attr('foo', 'bar') })

    time(200, function(){
      expect(count).to.be.eql(1)
      o.attr('foo', 'bar') })

    time(250, function(){
      expect(o.attr('foo')).to.be.eql('bar')
      expect(count).to.be.eql(1) })

    // html
    time(300, function(){
      count = 0
      o.html('bar') })

    time(350, function(){
      expect(count).to.be.eql(1)
      o.html('bar') })

    time(400, function(){
      expect(o.html()).to.be.eql('bar')
      expect(count).to.be.eql(1) })

    // style
    // time(90, function(){
    //   count = 0
    //   o.style('display', 'none') })

    // time(100, function(){
    //   expect(count).to.be.eql(1)
    //   o.style('display', 'none') })

    // time(110, function(){
    //   expect(o.style('display')).to.be.eql('none')
    //   expect(count).to.be.eql(1) })

    time(420, done)
  })

  /* istanbul ignore next */
  it('should memoize accessors individually across multiple elements', function(done) {
    if (typeof MutationObserver == 'undefined') return done()
    if (~window.navigator.userAgent.indexOf('Trident')) return done() // strange muto error on ie

    var increment1 = function() { ++count1 }
      , increment2 = function() { ++count2 }
      , conf = { attributes: true, characterData: true, subtree: true, childList: true }
      , muto1 = new MutationObserver(increment1)
      , muto2 = new MutationObserver(increment2)
      , o = once(node)('div', [1, 2])
      , count1 = 0
      , count2 = 0

    muto1.observe(node.children[0], conf)
    muto2.observe(node.children[1], conf)

    time(0, function(){
      o.text('foo') })

    time(50, function(){
      expect(count1).to.be.eql(1)
      expect(count2).to.be.eql(1)
      node.children[1].textContent = 'bar' })

    time(100, function(){
      count1 = count2 = 1
      o.text('bar') })

    time(150, function(){
      expect(count1).to.be.eql(2)
      expect(count2).to.be.eql(1) })

    time(200, done)
  })

  it('should not reset text cursor pos', function(done) {
    var o = once(node)('input', 1)

    time(0, function(){
      o.property('value', 'foo') })

    time(50, function(){
      o.node().selectionStart = 1
      o.node().selectionEnd = 1
      o.property('value', 'foo') })

    time(100, function(){
      expect(o.node().selectionEnd).to.be.eql(1)
      expect(o.node().selectionEnd).to.be.eql(1) })

    time(150, done)
  })

  it('should memoize accessors with functions as values', function(done) {
    var o = once(node)('input', 'foo')

    time(0, function(){
      o.property('value', String) })

    time(50, function(){
      o.node().selectionStart = 1
      o.node().selectionEnd = 1
      o.property('value', String) })

    time(100, function(){
      expect(o.node().selectionStart).to.be.eql(1)
      expect(o.node().selectionEnd).to.be.eql(1) })

    time(150, done)
  })

  it('should allow functions that return functions', function() {
    var o = once(node)('input', 'foo')
      , fn = String

    o.property('prop', wrap(fn))
    expect(o.node().prop).to.be.equal(fn)
    expect(o.property('prop')).to.be.equal(fn)
  })

  it('should deeply get/set properties', function() {
    var o = once(node)('input', 'foo')

    expect(o.property('state.value', 5)).to.be.a('function')
    expect(o.node().state.value).to.be.eql(5)
    expect(o.property('state.value')).to.be.equal(5)
  })

  it('should deeply get/set properties', function() {
    var o = once(node)('input', 'foo')

    o.property('state.value', 5)
    expect(o.node().state.value).to.be.eql(5)
    expect(o.property('state.value')).to.be.equal(5)

    o.property('state.value', function(d){ return d + 'bar' })
    expect(o.node().state.value).to.be.eql('foobar')
    expect(o.property('state.value')).to.be.equal('foobar')
  })

  it('should proxy draw function', function() {
    var o = once(node)
      , els = o('div', [1, 2])
      , result1, result2, result3

    node.draw = function() { result1 = true }
    node.children[0].draw = function() { result2 = true }
    node.children[1].draw = function() { result3 = true }

    expect(o.draw()).to.be.eql(o)
    expect(result1).to.be.ok
    
    expect(els.draw()).to.be.eql(els)
    expect(result2).to.be.ok
    expect(result3).to.be.ok
  })

  it('should work with existing emitterified node', function() {
    var div = emitterify(document.createElement('div'))
      , host = div.host = node
      , result
      
    once(node).on('foo', function() { result = true })
    once(div).emit('foo')
    expect(result).to.be.ok
  })

  it('should always match data with node order', function() {
    var o = once(node)
    
    o('li', [1, 2, 3], String)
      .text(String)

    expect(node.children[0].innerHTML).to.be.eql('1')
    expect(node.children[1].innerHTML).to.be.eql('2')
    expect(node.children[2].innerHTML).to.be.eql('3')

    o('li', [3, 1, 2], String)
      .text(String)
      
    expect(node.children[0].innerHTML).to.be.eql('3')
    expect(node.children[1].innerHTML).to.be.eql('1')
    expect(node.children[2].innerHTML).to.be.eql('2')
  })

  it('should allow parameterising node type by data', function() {
    var o = once(node)
    
    o(type, [1, 2, 3])

    expect(node.innerHTML).to.be.eql('<el-1 class="fix"></el-1><el-2 class="fix"></el-2><el-3 class="fix"></el-3>')

    function type(pd, pi) {
      function tag(d, i) { return 'el-' + d }
      tag.toString = function() { return '.fix' }
      return tag
    }
  })

  it('should not proceed with setters that are undefined/null', function() {
    var o = once(node)('input', 'foo')
      , fn = String
      , el = o.node()

    el.prop = 'foo'
    o.property('prop', undefined)
    expect(el.prop).to.be.equal('foo')

    el.prop = 'foo'
    o.property('prop', null)
    expect(el.prop).to.be.eql(null)

    el.prop = 'foo'
    o.property('prop', wrap(undefined))
    expect(el.prop).to.be.equal('foo')

    el.prop = 'foo'
    o.property('prop', wrap(null))
    expect(el.prop).to.be.equal(null)
  })

  it('should match with attrs in selector', function() {
    var o = once(node)

    o('li[foo="bar"]', 1)
    expect(node.innerHTML).to.eql('<li foo="bar"></li>')
    
    o('li[foo="baz"]', 1)
    expect(node.innerHTML).to.eql('<li foo="bar"></li><li foo="baz"></li>')
  })

  it('should respect detail on mouseevent', function() {
    var o = once(node)('li', 'foo')
      , event = document.createEvent("MouseEvent")
      , result
  
    event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    o.on('click', function(d, i, el, e){ result = e.detail })
    node.firstChild.dispatchEvent(event)
    expect(result).to.eql(1)
  })
  
  it('should allow switching selection if single argument a node', function() {
    once(node)('li', 'foo')
    once(node)('span', 'foo')

    expect(once(node.firstChild)(node.lastChild).node()).to.eql(node.lastChild)
    expect(once(node.lastChild)(node.firstChild).node()).to.eql(node.firstChild)
  })

  it('should remove attr if value is falsy', function() {
    var o = once(node)('li', 1)

    o.attr('foo', 'bar')
    expect(o.attr('foo')).to.eql('bar')

    o.attr('foo', false)
    expect(o.attr('foo')).to.be.not.ok
  })

  it('should set tag, css and attrs in both modes', function() {
    once(node)
      ('.foo', ['foo'])
        ('li[key="val"]', ['bar'])

    expect(node.innerHTML).to.eql('<div class="foo"><li key="val"></li></div>')
  })

  it('should always update child data during optimisation', function() {
    once(node)
      ('.foo', { foo: true })
        ('.bar', 1)

    expect(node.firstChild.firstChild.__data__.foo).to.be.ok
    expect(node.firstChild.firstChild.__data__.bar).to.not.be.ok

    once(node)
      ('.foo', { bar: true })
        ('.bar', 1)

    expect(node.firstChild.firstChild.__data__.foo).to.not.be.ok
    expect(node.firstChild.firstChild.__data__.bar).to.be.ok
  })

  it('should not inherit parent data if data is fn', function() {
    once(node)
      ('.foo', { foo: true })
        ('.bar', function(){ return 1 })

    expect(node.firstChild.firstChild.__data__).to.eql(1)
  })

  it('should pass index as implicit data', function(){
    var els = once(node)('li', ['a', 'b', 'c'])
      , indicies 
      , fn = function(d, i){ indicies.push([i, to.arr(this.parentNode.children).indexOf(this)]) }

    indicies = []
    els.each(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.text(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.html(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.attr('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.classed('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.property('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])
  })

  it('should pass index as implicit data when keyed', function(){
    var els = once(node)('li', ['a', 'b', 'c'], function(d){ return d })
      , indicies 
      , fn = function(d, i){ indicies.push([i, to.arr(this.parentNode.children).indexOf(this)]) }

    indicies = []
    els.each(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.text(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.html(fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.attr('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.classed('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])

    indicies = []
    els.property('foo', fn)
    expect(indicies).to.eql([[0, 0], [1, 1], [2, 2]])
  })

  it('should not spread event arguments, and should set index', function(){
    var el = once(node)('li', [1, 2, 3])
    
    el.on('foo', function(d, i, el, e){ 
      expect(e.detail).to.be.eql(['a', 'b', 'c'])
      expect(i).to.be.eql(1)
    })

    el.nodes[1].emit('foo', ['a', 'b', 'c'])
  })

  it('should always call node.draw', function(){
    var result = 0
    HTMLElement.prototype.draw = function(){ result++ }

    once(node)('li', { foo: 'bar' })
    expect(result).to.be.eql(1)

    once(node)('li', { foo: 'bar' })
    expect(result).to.be.eql(2)

    once(node)('span', 1)
    expect(result).to.be.eql(3)

    once(node)('span', 1)
    expect(result).to.be.eql(4)

    delete HTMLElement.prototype.draw
  })

  it('should have size api', function(){
    expect(once(node)('li', [1,2,3]).size()).to.eql(3)
  })

  it('should always deal with host node', function(){
    node.innerHTML = "<div></div><span></span>"
    node.lastChild.host = node.firstChild
    
    Object.defineProperty(node.lastChild, 'on', { 
      get: function(z) { return node.firstChild.on }
    , set: function(z) { return node.firstChild.on = z }
    })

    once(node)('span', 1).on('foo.bar', String)
    expect(node.lastChild.on.foo.bar)
      .to.eql(node.firstChild.on.foo.bar)
      .to.eql(String)
  })

  it('should not confuse shadow host with anchor host', function(){
    var el = once(node)('a[href="http://www.google.com/foo"]', 1)
    expect(node.firstChild.evented).to.be.ok
  })

  it('should emit cancelable events', function(done){
    var el = once(node)('div', 1)
    
    el.on('event', function(d, i, el, e){
      e.preventDefault()
      expect(e.defaultPrevented).to.be.ok
      done()
    }).emit('event')
  })

  it('should allow emitting arbitrary events', function(done){
    var el = once(node)('div', 1)
    
    el.on('event', function(d, i, el, e){
      expect(e.type).to.be.eql('event')
      expect(e.detail).to.be.eql('bar')
      done()
    }).emit('event', new window.CustomEvent('event', { detail: 'bar' }))
  })

})

function polyfill(){
  window = require('jsdom').jsdom('<div>').defaultView
  global.HTMLElement = window.HTMLElement
  global.document = window.document
}
