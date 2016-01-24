# Once

## [![Coverage Status](https://coveralls.io/repos/utilise/once/badge.svg?branch=master)](https://coveralls.io/r/utilise/once?branch=master) [![Build](https://api.travis-ci.org/utilise/once.svg)](https://travis-ci.org/utilise/once) once

Once is a declarative, terse and efficient way to manipulate the DOM for rendering. Once stamps out elements based on some data. It only updates the DOM with the minimal changes required to make it match the data. See the [main documentation here](https://github.com/utilise/utilise#--once). Below is just a cheat sheet of random examples:

<br>

##### Create three `li` and set their text

```js
once(node)
  ('li', [1, 2, 3])
    .text('foo')
```

```html
<li>foo</li>
<li>foo</li>
<li>foo</li>
```

##### Create three `li` and set their text to their data

```js
once(node)
  ('li', [1, 2, 3])
    .text(d => d)
```

```html
<li>1</li>
<li>2</li>
<li>3</li>
```

##### Create elements from arbitrary selector strings (omitting a tag name defaults to `div`)

```js
once(node)
  ('.foo[attr=value]', [1, 2, 3])
    .text(d => d)
```

```html
<div class="foo" attr="val">1</div>
<div class="foo" attr="val">2</div>
<div class="foo" attr="val">3</div>
```

##### Create three `td` cells on three `tr` rows (multiple parents) 

```js
rows = [
  { cells: [1, 2, 3] }
, { cells: [4, 5, 6] }
, { cells: [7, 8, 9] }
]

once(node)
  ('tr', rows)
    ('td', d => d.cells)
      .text(String)
```

```html
<tr>
  <td>1</td><td>2</td><td>3</td>
</tr>
<tr>
  <td>4</td><td>5</td><td>6</td>
</tr>
<tr>
  <td>7</td><td>8</td><td>9</td>
</tr>
```

##### Using objects, strings or numbers instead of an array is interpreted as an array of one element (i.e. create one element with the specified data)

```js
once(node)
  ('div', { foo: 'bar' })

once(node)
  ('div', 10)

once(node)
  ('div', 'Hi!')
```

##### Using `1` as the data is a shortcut for inheriting the parent data

```js
once(node)
  ('.parent', { foo: 'bar' })
    ('.child', 1)
```

##### Modify a selection with D3-style accessors (can use constants or functions which receive the data and index)

```js
once(node)
  ('.parent', { foo: 'bar' })
    .text(d => d.foo)
    .classed('bar', true)
    ('.child', 1)
      .attr('key', d => d.foo)
      .html('Hi!')
```

```html
<div class="parent bar">
  bar
  <div class="child" key="bar">
    Hi!
  </div>
</div>
```

##### Save a reference to a selection to spawn different elements at that level

```js
var o = once(node)

o('header', 1)

o('article', { text: 'foo' })
  ('.content', 1)
    .text(d => d.text)

o('footer', 1)
```

```html
<header></header>
<article>
  <div class="content">foo</div>
</article>
<footer></footer>
```


##### Change parent selection with a single argument to create more elements at that level

```js
var o = once(node)

o('ul', 1)
  ('li', [1,2,3])

o('ul')
  ('footer', 1)
```

```html
<ul>
  <li></li>
  <li></li>
  <li></li>
  <footer></footer>
</ul>
```

##### Insert an element before another rather than appending at the end

```js
var o = once(node)

o('li', [1, 2, 3])

o('header', 1, null, ':first-child')
```

```html
<ul>
  <header></header>
  <li></li>
  <li></li>
  <li></li>
</ul>
```

##### Use enter and exit subselections to access newly created or newly removed elements

```js
once(node)
  ('li', [1])

once(node)
  ('li', [1, 2])
    .enter()
    .attr('new', 'yes')
```

```html
<li></li>
<li new="yes"></li>
```

##### Use `.on` and `.emit` as syntatic sugar for `.addEventListener` and `.dispatchEvent`

```js
var o = once(node)

o('li', [{ href: '/1' }, { href: '/2' }, { href: '/3' }])
  .attr('href', d => d.href)
  .on('click', d => o(node).emit('navigate', d.href))
```

```html
<a href="/1"></a>
<a href="/2"></a>
<a href="/3"></a>
```