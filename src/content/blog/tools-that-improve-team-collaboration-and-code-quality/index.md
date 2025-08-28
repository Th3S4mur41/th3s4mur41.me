---
title: Tools that improve team collaboration and code quality
date: 2018-12-10T14:05:24.964Z
image: ''
published: true
description: >-
  When you start working on a new website or a web app, chances are that you
  don’t spend much time thinking about code style or code quality…
tags: []
keywords: []
canonical: >-
  https://medium.com/@th3s4mur41/tools-that-improve-team-collaboration-and-code-quality-fad9394c9ec6
---

When you start working on a new website or a web app, chances are that you don’t spend much time thinking about code style or code quality. Why?! Just because you already have a well configured IDE and you reuse the same coding guidelines that you already know by heart over and over again.

Everything changes when you start collaborating with other people. Suddenly you start looking at code that looks nothing like yours. It gets even worse where multiple styles start mixing in the same file.

There are many reasons for this situation… They might use different editors, follow different guidelines, have different opinions or just don’t care about code style at all.

### Guidelines

That’s usually the time when you start defining common guidelines which is not an easy step. I mean every developer argued at least once in his career or at least witnessed a debate on whether to use tabs or spaces for indentation, right?

Once you reach an agreement, you document the project guidelines and everybody starts following them. Not quite. To follow guidelines you have to read and understand them. That’s the first pitfall. Team members that were included in the definition of the guidelines might not have issues to know and follow them, but those that start on the project usually don’t tend to read lengthy documentation and rather start to code right away.

![](C:\src\test\medium-export\posts\md_1712848580652\img\1__mYpT__zEU1zF8WDvB__OlHuw.jpeg)

So somebody in the team has to tediously review each pull request to enforce your guidelines. But guidelines are usually simple rules. Rules is something that can be automatized, right? Right!

### Linters

Linters are little tools that you can configure according to your guidelines to verify the code for you.

You just commit the linter configuration with your code, and they take care of the rest.

First you should add your linters as a pre-commit hooks. You can either write your own scripts and have every developer install it as hook on their machine, but that is not something you can enforce.

I currently prefer to do it with [Husky](https://www.npmjs.com/package/husky). Once done, the hooks, should prevent anybody to commit code that doesn’t match your guidelines.

![](C:\src\test\medium-export\posts\md_1712848580652\img\1__itzWrI7N3JyKl2bHemxGqg.png)

That’s good news for the reviewer, but might be frustrating for team members that get their commit constantly rejected and have to get back to their code. It would be better if they could be warned about guidelines while writing their code.

### Editors

Good news, most linters are either included in many IDEs or can be added in form of a plugin. So invalid code is highlighted in your editor and you get hints about the error and how to fix it. Isn’t that nice?!

You shouldn’t limit the use of linters to the usual suspect (yes, I mean JavaScript) though. There are linters for almost every type of file you could encounter: JavaScript, TypeScript, PHP, CSS, SCSS, LESS (stylesheets should be checked too)… You can even lint configuration or data files like JSON.

But wait… If rules checking can be automated, couldn’t you also automatically fix errors? Well yes and no. Some linter have an auto fix option, but they usually can only fix a few rules, but definitely not all.

However, there is definitely something that can be automatically “fixed”: your code style. Wait, isn’t that what linters are for?! Well they somehow can, but their main purpose is to enforce guidelines and guarantee code quality.

### Code style

Ok, so what’s the problem with your code style? Well most likely nothing since it’s mostly just a matter of preference but code is easier to read and maintain if the code style is identical throughout the project. Chances are that you don’t even think that much about code style since your IDE is taking care of it for you. So it is already kind of automated, right?

![](C:\src\test\medium-export\posts\md_1712848580652\img\1__vxyWmPd8tZhmuGhnZP0__zg.jpeg)

The answer is yes, many IDE even allow you to store their style configuration inside your project and share it with your team. That’s good but only if the whole team is using the same IDE. So what happens if the team is using multiple IDEs? Well, you could store the settings for each IDE in your project. But getting multiple IDEs to use the exact same code style configuration is often quite difficult or sometimes even impossible forcing some members of the team to constantly fix code style their IDE is messing up manually.

### Code formatter

That’s where code formatter like [prettier](https://prettier.io/) come in handy. Prettier is an opinionated code formatter that is integrated or has a plugin for the most common IDEs and replaces their own formatter…

![](C:\src\test\medium-export\posts\md_1712848580652\img\1__XajY__8awwlbpDmg9LnBH7A.jpeg)

That sounds good, right? So now you just need to store a single code style configuration in your project and it works just the same regardless of the IDE.

But what if someone uses an unsupported IDE? Well you’re covered there too. Prettier can be combined with your linters and run as a pre-commit hook, reformatting the code automatically before it’s being pushed.

Ok, but wait, what’s “opinionated” you’re gonna ask?! Well that means that the prettier community has defined a consistent code style leaving you just a very few configuration options. Some might not like the lack of configurability, but try to see it like this: with prettier you no longer need to argue about code style within your team, because the prettier community has already made the decision for you.

### Conclusion

Just like IDEs, IntelliSense and code autocompletion, linters and code formatters are modern tools that are here to help you get more efficient and spend your precious time on things that matter. Moreover they help enforce your rules and best practices improving the code quality and reducing the risk of bugs.

So the only question I have left right now is: “when do you start?”
