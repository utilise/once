var d3 = global.d3 = require('d3')
  , expect = require('chai').expect
  , client = require('client')
  , shim = !client && polyfill()
  , attr = require('attr')
  , key = require('key')
  , el = require('el')
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

  it('should append only one div by default', function() {
    once(node, '.sth')
    once(node, '.sth')
    expect(node.innerHTML).to.be.eql('<div class="sth"></div>')
  })

  it('should append elements by data', function() {
    once(node, 'li', [1,2,3])
    expect(node.innerHTML).to.be.eql('<li></li><li></li><li></li>')
  })

  it('should remove elements by data', function() {
    once(node, 'li', [1,2,3])
    once(node, 'li', [])
    expect(node.innerHTML).to.be.eql('')
  })

  it('should be able to extend enter/update/exit selection', function() {
    once(node, 'li', [1,2])
      .classed('sth', true)
      .text(String)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')

    once(node, 'li', [1,2,3])
      .in
      .classed('new', true)

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li><li class="new"></li>')

    var out = once(node, 'li', [1,2])
      .out
      .node()
      .className

    expect(node.innerHTML).to.be.eql('<li class="sth">1</li><li class="sth">2</li>')
    expect(out).to.be.eql('new')

  })

  it('should key elements by data', function() {
    once(node, 'li', [{id:1},{id:2},{id:3}])
    once(node, 'li', [{id:3},{id:2}])
    expect(node.innerHTML).to.be.eql('<li></li><li></li>')
  })  

  it('should insert before', function() {
    once(node, 'li.B')
    once(node, 'li.A', [0], '.B')
    expect(node.innerHTML).to.be.eql('<li class="A"></li><li class="B"></li>')
  })

  it('should be able to chain onces', function() {
    once(node, 'li', [1, 2])
      .text(String)
        .once('a', [3, 4])
        .text(String)

    expect(node.innerHTML).to.be.eql('<li>1<a>3</a><a>4</a></li><li>2<a>3</a><a>4</a></li>')
  })

  it('should be able to deal with real elements too', function() {
    once(node, el('foo-bar.classA[attr=value]'))
    once(node, el('foo-bar.classA[attr=value]'))
    expect(node.firstElementChild.tagName.toLowerCase()).to.be.eql('foo-bar')
    expect(node.firstElementChild.className).to.be.eql('classA')
    expect(attr(node.firstElementChild, 'attr')).to.be.eql('value')
    expect(node.firstElementChild.innerHTML).to.be.eql('')
  })

  it('should treat string data as one element', function() {
    once(node, 'h1', 'abc').text(String)
    expect(node.innerHTML).to.be.eql('<h1>abc</h1>')
  })

  it('should not render anything with undefined', function() {
    once(node, 'li', undefined)
    expect(node.innerHTML).to.be.eql('')
  })

  it('should render with single object', function() {
    once(node, 'li', { foo: 'bar' }).text(key('foo'))
    expect(node.innerHTML).to.be.eql('<li>bar</li>')
  })

  it('should not render any negatives', function() {
    once(node, 'li', false)
    once(node, 'li', 0)
    once(node, 'li', '')
    once(node, 'li', [])

    expect(node.innerHTML).to.be.eql('')
  })

  it('should not render any negatives', function() {
    once(node, 'li', false)
    once(node, 'li', 0)
    once(node, 'li', '')
    once(node, 'li', [])

    expect(node.innerHTML).to.be.eql('')
  })

  it('should render true as one el', function() {
    once(node, 'li', true).text(String)
    expect(node.innerHTML).to.be.eql('<li>true</li>')
  })

  it('should render number as one el', function() {
    once(node, 'li', 5).text(String)
    expect(node.innerHTML).to.be.eql('<li>5</li>')
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