var expect = require('chai').expect
  , window = require("jsdom").jsdom('<div>').defaultView
  , node = window.document.body.firstElementChild
  , document = global.document = window.document
  , createElement = document.createElement = polyfill()
  , HTMLElement = global.HTMLElement = window.HTMLElement
  , once = require('./')
  , el = require('el')

describe('once', function() {

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
    expect(node.innerHTML).to.be.eql('<foo-bar attr="value" class="classA"></foo-bar>')
  })

})


function polyfill(){
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