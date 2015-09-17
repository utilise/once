var expect = require('chai').expect
  , client = require('utilise.client')
  , shim = !client && polyfill()
  , d3 = global.d3 = require('d3')
  , inherit = require('utilise.inherit')  
  , wrap = require('utilise.wrap')  
  , attr = require('utilise.attr')
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

  it('should be able to chain onces', function() {
    once(node)('li', [1, 2])
      .text(String)
        ('a', [3, 4])
        .text(String)

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
      ('h1', ['abc'])
        .text(String)

    expect(node.innerHTML).to.be.eql('<h1>abc</h1>')
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
    if (~element.className.indexOf(d)) return;
    element.className += ' ' + d
    element.className = element.className.trim()
  }
}