var expect = require('chai').expect
  , client = require('utilise.client')
  , shim = !client && polyfill()
  , d3 = global.d3 = require('d3')
  , inherit = require('utilise.inherit')  
  , wrap = require('utilise.wrap')  
  , attr = require('utilise.attr')
  , time = require('utilise.time')
  , key = require('utilise.key')
  , el = require('utilise.el')
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
    once(node)('li', [1,2,3])
    once(node)('li', [])
    expect(node.innerHTML).to.be.eql('')
  })

  it('should be able to extend enter/update/exit selection', function() {
    once(node)
      ('li', [1,2])
        .classed('sth', true)
        .text(String)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')

    once(node)('li', [1,2,3])
      .enter
      .classed('new', true)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li><li class="new"></li>')

    var out = once(node)('li', [1,2])
      .exit
      .node()
      .className

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')
    expect(out).to.be.eql('new')
  })

  it('should key elements by index', function() {
    once(node)('li', [{id:1},{id:2},{id:3}])
    once(node)('li', [{id:3},{id:2}])
    expect(node.innerHTML).to.be.eql('<li></li><li></li>')
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

  it('should be able to chain scopes', function() {
    node.innerHTML = '<li><a></a></li>'
    once(node)('li')('a')
      ('i', [1,2])
        .text(String)

    expect(node.innerHTML).to.be.eql('<li><a><i>1</i><i>2</i></a></li>')
  })

  it('should be able to deal with real elements too', function() {
    once(node)(el('foo-bar.classA[attr=value]'), 1)
    once(node)(el('foo-bar.classA[attr=value]'), 1)
    expect(node.firstElementChild.tagName.toLowerCase()).to.be.eql('foo-bar')
    expect(node.firstElementChild.className).to.be.eql('classA')
    expect(attr(node.firstElementChild, 'attr')).to.be.eql('value')
    expect(node.firstElementChild.innerHTML).to.be.eql('')
  })

  it('should clone real elements', function() {
    once(node)(el('foo-bar'), [1,2,3])
    expect(node.childNodes.length).to.be.eql(3)
  })

  it('should process function for data', function() {
    once(node)
      ('div', [{foo:'bar'},{foo:'baz'}])
        ('li', key('foo'))
          .text(String)

    expect(node.innerHTML).to.be.eql('<div><li>bar</li></div><div><li>baz</li></div>')
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
      ('li', [{foo:'bar'}, {foo:'baz'}])
        (key('foo'), 1)

    expect(node.innerHTML).to.be.eql('<li><bar></bar></li><li><baz></baz></li>')
  })

  it('should inherit data', function() {
    once(node)
      ('ul', { foo:'bar' })
        ('li', inherit)
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
    expect(o['style']).to.be.a('function')
    expect(o['on']).to.be.a('function')
    expect(o['each']).to.be.a('function')
    expect(o['node']).to.be.a('function')
    expect(o['datum']).to.be.a('function')
    expect(o['property']).to.be.a('function')
  })

  it('should have accessors on subsequent operations', function() {
    var o = once(node)('li', 1)
    expect(o['text']).to.be.a('function')
    expect(o['classed']).to.be.a('function')
    expect(o['html']).to.be.a('function')
    expect(o['attr']).to.be.a('function')
    expect(o['style']).to.be.a('function')
    expect(o['on']).to.be.a('function')
    expect(o['each']).to.be.a('function')
    expect(o['node']).to.be.a('function')
    expect(o['datum']).to.be.a('function')
    expect(o['property']).to.be.a('function')
  })

  it('should respect > selector', function() {
    once(node)
      ('ul', 1)
        ('li', 1)
          .text(String)

    once(node)
      ('div > li', 2)
        .text(String)
          
    expect(node.innerHTML).to.be.eql('<ul><li>1</li></ul><li>2</li>')
  })

  it('should not need data if selector is function', function() {
    once(node)(function(){ return 'div' })
    expect(node.innerHTML).to.be.eql('<div></div>')
  })

  it('should emitterify elements', function(){
    var el = once(node)('div', 1).on('foo', String)

    expect(el.on).to.be.ok
    expect(el.once).to.be.ok
    expect(el.emit).to.be.ok

    expect(node.on).to.be.ok
    expect(node.once).to.be.ok
    expect(node.emit).to.be.ok

    expect(node.firstChild.on).to.be.ok
    expect(node.firstChild.once).to.be.ok
    expect(node.firstChild.emit).to.be.ok
    expect(node.firstChild.on.foo).to.be.ok
  })

  it('should emitterify idempotently', function(){
    var el = once(node)('div', 1).on('foo', String)

    expect(node.firstChild.on.foo).to.be.ok
    once(node)('div')
    expect(node.firstChild.on.foo).to.be.ok
  })

  it('should emit custom events', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('synthetic', function(d){ result1 = d })
    el.on('synthetic', function(d){ result2 = d })
    
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

  it('should emit custom events - with namespaces', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('synthetic.ns1', function(d){ result1 = d })
    el.on('synthetic.ns2', function(d){ result2 = d })
    
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

    node.firstChild.on('click', function(d){ result1 = d })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(1)
  })

  it('should emit dom events - on o', function(){
    var el = once(node)('div', 1)
      , result1, result2

    el.on('click', function(d){ result2 = d })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result2).to.eql(1)
  })

  it('should emit dom events - with namespaces', function(){
    var el = once(node)('div', 1)
      , result1, result2

    node.firstChild.on('click.ns1', function(d){ result1 = d })
    el.on('click.ns2', function(d){ result2 = d })
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(1)
    expect(result2).to.eql(1)
  })

  it('should not add duplicate listeners', function(){
    var el = once(node)('div', 1)
      , result1 = 0, result2 = 0

    /* istanbul ignore next */
    ;( node.firstChild.on('click.ns1', function(d){ result1 += d })
    , el.on('click.ns2', function(d){ result2 += d })
    , node.firstChild.on('click.ns1', function(d){ result1 += d })
    , el.on('click.ns2', function(d){ result2 += d })
    , node.firstChild.on('click.ns1', function(d){ result1 += d })
    , el.on('click.ns2', function(d){ result2 += d })
    )
    
    var event = document.createEvent("Event")
    event.initEvent('click', false, false)
    node.firstChild.dispatchEvent(event)
    expect(result1).to.eql(1)
    expect(result2).to.eql(1)
  })

  it('should be able to chain after event', function(){
    var el = once(node)('div', 1)
    expect(el.on('event', String)).to.eql(el)
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

  it('should emit data if no param specified', function(done){
    var el = once(node)('div', { foo: 'bar' })
      , i = 0
      , expects = function(data){ 
          expect(data).to.be.eql({ foo: 'bar' })
          if (++i == 4) done()
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
    node.innerHTML = "<div></div><span></span>"
    node.lastChild.host = node.firstChild

    var el = once(node)('div', 1)
      , sr = once(node)('span', 1)
      , result

    el.on('event.sr', function(d){ result = d })

    result = undefined
    sr.emit('event', 'foo')
    expect(result).to.eql('foo')

    result = undefined
    node.lastChild.emit('event', 'bar')
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

  it('should allow accessors as getters as usual too', function() {
    var o = once(node)('div', 'foo')
      .property('foo', String)
      .classed('foo', String)
      .style('display', 'none')
      .attr('foo', String)
      .text(String)

    expect(o.text()).to.eql('foo')
    expect(o.classed('foo')).to.be.ok
    expect(o.classed('bar')).to.not.be.ok
    expect(o.attr('foo')).to.eql('foo')
    expect(o.style('display')).to.eql('none')
    expect(o.property('foo')).to.eql('foo')
  })

  it('should allow .each', function() {
    var o = once(node)('div', ['foo', 'bar'])
      .each(function(d){ this.foo = d })
      .each(function(d){ this.foo = 'baz' })

    expect(node.childNodes[0].foo).to.eql('baz')
    expect(node.childNodes[1].foo).to.eql('baz')
  })

  it('should allow .datum', function() {
    var o = once(node)('div', 'foo')
      .datum('bar')
      .datum('baz')

    expect(node.childNodes[0].__data__).to.eql('baz')
  })

  it('should allow .sel', function() {
    var o = once(node)('div', 'boo')
      .each(function(d){ this.foo = 'bar' })
      .sel
      .each(function(d){ this.foo = 'baz' })

    expect(node.childNodes[0].foo).to.eql('baz')

    var o = once(node)('div', 'foo')
      .datum('bar')
      .sel
      .each(function(d){ this.foo = d })

    expect(node.childNodes[0].foo).to.eql('bar')
  })

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

    time(10, function(){
      expect(count).to.be.eql(1)
      o.text('foo') })

    time(20, function(){
      expect(o.text()).to.be.eql('foo')
      expect(count).to.be.eql(1) })

    // attr
    time(30, function(){
      count = 0
      o.attr('foo', 'bar') })

    time(40, function(){
      expect(count).to.be.eql(1)
      o.attr('foo', 'bar') })

    time(50, function(){
      expect(o.attr('foo')).to.be.eql('bar')
      expect(count).to.be.eql(1) })

    // html
    time(60, function(){
      count = 0
      o.html('bar') })

    time(70, function(){
      expect(count).to.be.eql(1)
      o.html('bar') })

    time(80, function(){
      expect(o.html()).to.be.eql('bar')
      expect(count).to.be.eql(1) })

    // style
    time(90, function(){
      count = 0
      o.style('display', 'none') })

    time(100, function(){
      expect(count).to.be.eql(1)
      o.style('display', 'none') })

    time(110, function(){
      expect(o.style('display')).to.be.eql('none')
      expect(count).to.be.eql(1) })

    time(120, done)
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

    time(10, function(){
      expect(count1).to.be.eql(1)
      expect(count2).to.be.eql(1)
      node.children[1].textContent = 'bar' })

    time(20, function(){
      count1 = count2 = 1
      o.text('bar') })

    time(30, function(){
      expect(count1).to.be.eql(2)
      expect(count2).to.be.eql(1) })

    time(40, done)
  })

  it('should not reset text cursor pos', function(done) {
    var o = once(node)('input', 1)

    time(0, function(){
      o.property('value', 'foo') })

    time(10, function(){
      o.node().selectionStart = o.node().selectionEnd = 1
      o.property('value', 'foo') })

    time(20, function(){
      expect(o.node().selectionStart).to.be.eql(1)
      expect(o.node().selectionEnd).to.be.eql(1) })

    time(30, done)
  })

  it('should memoize accessors with functions as values', function(done) {
    var o = once(node)('input', 'foo')

    time(0, function(){
      o.property('value', String) })

    time(10, function(){
      o.node().selectionStart = o.node().selectionEnd = 1
      o.property('value', String) })

    time(20, function(){
      expect(o.node().selectionStart).to.be.eql(1)
      expect(o.node().selectionEnd).to.be.eql(1) })

    time(30, done)
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

    o.property('state.value', 5)
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

})

function polyfill(){
  window = require("jsdom").jsdom('<div>').defaultView
  global.HTMLElement = window.HTMLElement
  global.document = window.document
  document.createElement = createElement()
}

function createElement(){
  var proxy = document.createElement
  return function(){
    var created = proxy.apply(this, arguments)
    created.classList = { add: add(created) }
    return created
  }
}

function add(element){
  return function(d){
    // if (~element.className.indexOf(d)) return;
    element.className += ' ' + d
    element.className = element.className.trim()
  }
}