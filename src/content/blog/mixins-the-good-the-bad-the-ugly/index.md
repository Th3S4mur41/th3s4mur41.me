---
title: 'Mixins: the good, the bad, the ugly…'
date: 2020-01-09T15:35:18.317Z
image: ''
published: true
description: >-
  Mixins in SCSS and LESS can be used in many different ways… Some are good
  other not so much!
tags: []
keywords: []
canonical: https://medium.com/@th3s4mur41/mixins-the-good-the-bad-the-ugly-46dee687ab29
---

![](C:\src\test\medium-export\posts\md_1712848580652\img\1__xGH__uhi__yDtDV73Quv8V6A.jpeg)

Working with [SCSS](https://sass-lang.com/guide#topic-6) and [LESS](http://lesscss.org/features/#mixins-feature), I’ve become used to see people using mixins and I used quite a bunch of them myself. Over time I’ve seen them being used in several different ways, some of which I think aren’t good.

But let’s start with…

### The good 😊

Mixins allow you to have a single definition for a group of properties that are used throughout your code with different values by simply replacing the mentioned values through variable parameters.

Thanks to this you don’t have to repeat the same code over and over again or don’t have to create multiple classes for each potential value you’d need.

An example I like for this is line-clamping…  
While not a standard (yet), its prefixed version is currently well supported by many browsers, but requires to set multiple properties. Something you don’t want to copy over and over again. Moreover, the amount of lines you want to cut the text at is variable.

So a version of line-clamping without pre-processor to cut either after 2 or 3 lines would probably look like this:

**CSS**

.clamp-2-lines {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: 2;  
 _\-webkit-box-orient_: **vertical**;  
}  
.clamp-3-lines {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: 3;  
 _\-webkit-box-orient_: **vertical**;  
}

**HMTL**

<p class="clamp-2-lines">cut text after 2 lines</p>  
<p class="clamp-3-lines">cut text after 3 lines</p>

Now imagine the same code if you need 10 variations of it.  
With a mixin, this get’s much nicer

**LESS**

.line-clamp(@lines) {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: @lines;  
 _\-webkit-box-orient_: **vertical**;  
}

.class-that-cuts-after-2-lines {  
 .line-clamp(2);  
}  
.class-that-cuts-after-3-lines {  
 .line-clamp(3);  
}

**SCSS**

@mixin line-clamp($lines) {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: $lines;  
 _\-webkit-box-orient_: **vertical**;  
}

.class-that-cuts-after-2-lines {  
 @include line-clamp(2);  
}  
.class-that-cuts-after-3-lines {  
 @include line-clamp(3);  
}

**HMTL**

<p class="clamp-2-lines">cut text after 2 lines</p>  
<p class="clamp-3-lines">cut text after 3 lines</p>

### The bad 😣

Cutting a single line of text also requires multiple properties that have to be used in combination. So the same logic could be applied, right?!

#### Static mixins

**LESS**

.text-overflow() {  
 _overflow_: **hidden**;  
 _white-space_: **nowrap**;  
 _text-overflow_: **ellipsis**;  
}  
.class-that-cuts-after-1-line {  
 .text-overflow();  
}

**SCSS**

@mixin text-overflow() {  
 _overflow_: **hidden**;  
 _white-space_: **nowrap**;  
 _text-overflow_: **ellipsis**;  
}  
.class-that-cuts-after-1-line {  
 @include text-overflow();  
}

**HTML**

<p class="class-that-cuts-after-1-line">cut text after 1 line</p>

Well yes, we could, but in this case we don’t need any variable parameter. So in cases where pre-processors don’t provide any advantages, vanilla CSS\* should in my opinion always be the preferred solution.

> _\*_ [_Vanilla CSS is just CSS, vanilla making it absolutely clear that it’s CSS and not a superset of it like LESS or SASS (which are also “CSS”)._](https://stackoverflow.com/a/40115909/7041074)

So simply replacing the mixin through a generic class makes both the code (LESS/SCSS) and the output (CSS) smaller and also easier to debug.

**CSS**

.text-overflow {  
 _overflow_: **hidden**;  
 _white-space_: **nowrap**;  
 _text-overflow_: **ellipsis**;  
}

**HTML**

<p class="text-overflow">cut text after 1 line</p>

#### Compatibility mixins

Ok so if there is no variable parameter, mixins should not be used?  
Yes and no… There is one use case where I still use mixins sometimes: When I need a prefixed version of a property for browser support.

**LESS**

.display-grid() {  
 _display_: **\-ms-grid**;  
 _display_: **grid**;  
}  
.grid-template-rows(@value) {  
 _\-ms-grid-rows_: @value;  
 _grid-template-rows_: @value;  
}  
.grid-template-columns(@value) {  
 _\-ms-grid-columns_: @value;  
 _grid-template-columns_: @value;  
}

.class-with-grid-layout {  
 .grid();  
 .grid-template-rows(auto 1fr);  
 .grid-template-columns(1fr 20rem 2fr);  
}

**SCSS**

@mixin display-grid() {  
 _display_: **\-ms-grid**;  
 _display_: **grid**;  
}  
@mixin grid-template-rows(@value) {  
 _\-ms-grid-rows_: @value;  
 _grid-template-rows_: @value;  
}  
@mixin grid-template-columns(@value) {  
 _\-ms-grid-columns_: @value;  
 _grid-template-columns_: @value;  
}

.class-with-grid-layout {  
 @include grid();  
 @include grid-template-rows(auto 1fr);  
 @include grid-template-columns(1fr 20rem 2fr);  
}

Now you might argue, that this could be covered by a simple mixin, like this:

**LESS**

.display-grid(@templateRow, @templateColumn) {  
 _display_: **\-ms-grid**;  
 _display_: **grid**;  
 _\-ms-grid-rows_: @templateRow;  
 _grid-template-rows_: @templateRow;  
 _\-ms-grid-columns_: @templateColumn;  
 _grid-template-columns_: @templateColumn;  
}

.class-with-grid-layout {  
 .grid(auto 1fr, 1fr 20rem 2fr);  
}

**SCSS**

@mixin display-grid(@templateRow, @templateColumn) {  
 _display_: **\-ms-grid**;  
 _display_: **grid**;  
 _\-ms-grid-rows_: @templateRow;  
 _grid-template-rows_: @templateRow;  
 _\-ms-grid-columns_: @templateColumn;  
 _grid-template-columns_: @templateColumn;  
}

.class-with-grid-layout {  
 @include grid(auto 1fr, 1fr 20rem 2fr);  
}

That is indeed correct, but like there are good reasons to not use shorthands in CSS, there are also use cases where defining display, row and column template in one place will not work.

Whenever possible though, I will always prefer to stick to standard vanilla CSS here too and let tools like [autoprefixer](https://autoprefixer.github.io/) take care of adding the necessary prefixed versions for me.

### The ugly 🤯

Did you notice, that if you leave out the parenthesis in **LESS**, a mixin is not to differentiate from a regular class. Well, it turns out you can do that (but please don’t)…  
So the text overflow example above could also look like this:

**LESS**

.text-overflow {  
 _overflow_: **hidden**;  
 _white-space_: **nowrap**;  
 _text-overflow_: **ellipsis**;  
}  
.class-that-cuts-after-1-line {  
 .text-overflow;  
}

**HTML**

<p class="class-that-cuts-after-1-line">cut text after 1 line</p>

That can quickly become a problem in big projects when people start using **any class** like a mixin, even when they are not intended that way.

Imagine for a second that you have a whole bunch of classes following a naming convention and there is some code targeting all elements that use those classes:

**LESS**

\[class^='icon-'\]::before,  
\[class\*=' icon-'\]::before {  
 margin: 5px  
}  
.icon-class-1 {  
 width: 20px;  
 height: 20px;  
}

**HTML**

<img class="icon-class-1">

In this example, the image will indeed have a margin of 5px as intended.  
Now consider the same example, but for whatever reason, you want to use the class as a mixin instead of in the HTML:

**LESS**

\[class^='icon-'\]::before,  
\[class\*=' icon-'\]::before {  
 margin: 5px  
}  
.icon-class-1 {  
 width: 20px;  
 height: 20px;  
}  
.my-image {  
 .icon-class-1;  
}

**HTML**

<img class="my-image">

In the example above, the class attribute in HTML does not contain a value starting with _icon-_ so the margin will not be applied.

This is one of the reasons I prefer SCSS over LESS since the language doesn’t allow such mix up.

### CSS custom properties 😍

What do [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) aka. CSS variables have to do with mixins?

Well let’s get back to the first example we had:

**LESS**

.line-clamp(@lines) {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: @lines;  
 _\-webkit-box-orient_: **vertical**;  
}

.class-that-cuts-after-2-lines {  
 .line-clamp(2);  
}  
.class-that-cuts-after-3-lines {  
 .line-clamp(3);  
}

**SCSS**

@mixin line-clamp($lines) {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: $lines;  
 _\-webkit-box-orient_: **vertical**;  
}

.class-that-cuts-after-2-lines {  
 @include line-clamp(2);  
}  
.class-that-cuts-after-3-lines {  
 @include line-clamp(3);  
}

**HMTL**

<p class="clamp-2-lines">cut text after 2 lines</p>  
<p class="clamp-3-lines">cut text after 3 lines</p>

Once compiled, the CSS would look exactly like it was before you switched the repetitive parts for a mixin:

**CSS**

.clamp-2-lines {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: 2;  
 _\-webkit-box-orient_: **vertical**;  
}  
.clamp-3-lines {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: 3;  
 _\-webkit-box-orient_: **vertical**;  
}

**HMTL**

<p class="clamp-2-lines">cut text after 2 lines</p>  
<p class="clamp-3-lines">cut text after 3 lines</p>

So there is nothing variable anymore and you get the same “big” code as before.   
CSS variables allow you to do basically the same as a variable mixin but with two huge advantages:   
\- The variable can be changed at run time (e.g. through JavaScript)  
\- The output CSS used by your page is just as “small” as the coded one

So the example above would look like this:

**CSS**

.line-clamp {  
 _display_: **\-webkit-box**;  
 _overflow_: **hidden**;  
 _\-webkit-line-clamp_: var(--visible-lines);  
 _\-webkit-box-orient_: **vertical**;  
}

.class-that-cuts-after-2-lines {  
 --visible-lines: 2;  
}  
.class-that-cuts-after-3-lines {  
 --visible-lines: 3  
}

**HMTL**

<p class="clamp-2-lines line-clamp">cut text after 2 lines</p>  
<p class="clamp-3-lines line-clamp">cut text after 3 lines</p>

### Conclusion

So I would just summarize by saying that mixins were a great workaround (and still are if you still have to support IE) for something CSS was lacking before custom properties.  
But when given the possibility (browser support), I prefer the pure CSS solution to a superset like LESS or SCSS.
