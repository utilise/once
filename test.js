var expect = require('chai').expect
  , window = require("jsdom").jsdom('<div>').defaultView
  , el = window.document.body.firstElementChild
  , HTMLElement = global.HTMLElement = window.HTMLElement
  , once = require('./')

describe('once', function() {

  it('should append only one div by default', function() {
    once(el, '.sth')
    once(el, '.sth')
    expect(el.innerHTML).to.be.eql('<div class="sth"></div>')
  })

})