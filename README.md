# TF-Engine

A modular UI framework for MediaWiki/Fandom that combines a lightweight CSS design system with an optional JavaScript engine.

TF-Engine can be used as:

* **CSS only** — zero JavaScript required.
* **CSS + JS** — automatic components, themes, animations, runtime API, diagnostics, and future editor features.

---

# Features

* Pure CSS design system
* Optional JavaScript engine
* Dynamic themes
* CSS variable bridge
* Automatic component mounting
* Runtime configuration API
* Module system
* Scroll animations
* Storage API
* Visual Editor (work in progress)
* Diagnostics and statistics
* Designed for MediaWiki and Fandom

---

# Repository structure

```text
TF-ENGINE/
│
├── README.md
├── LICENSE
│
├── css/
│   ├── tf-engine.css          ← Compiled stylesheet
│   ├── variables.css          ← CSS variables & themes
│   ├── base.css               ← Reset & typography
│   ├── components.css         ← UI components
│   ├── utilities.css          ← Utility classes
│   └── responsive.css         ← Responsive rules
│
├── js/
│   ├── tf-engine.js           ← Core engine
│   ├── defaults.js            ← Factory defaults
│   └── config.js              ← User configuration
│   
├── editor/
│   ├── editor.js
│   ├── diagnostics.js
│   ├── highlighter.js
│   ├── statistics.js
│   ├── outline.js
│   └── autocomplete.js
│
├── docs/
│   ├── installation.md
│   ├── configuration.md
│   ├── components.md
│   ├── variables.md
│   └── usage.md
│
├── examples/
    ├── index.html
    ├── cards.html
    ├── tabs.html
    ├── dashboard.html
   └ ── infobox.html

```

---

# Installation

## CSS only

Copy the contents of `css/tf-engine.css` into:

* `MediaWiki:Common.css`
* `MediaWiki:Wiki.css`

Then wrap your content:

```html
<div class="tf-engine">
    ...
</div>
```

---

## CSS + JavaScript

Load the JavaScript files in this order:

```text
1. tf-engine.js
2. defaults.js
3. config.js

9. components/index.js
10. component modules

11. editor/editor.js
12. editor/diagnostics.js
13. editor/highlighter.js
14. editor/statistics.js
15. editor/outline.js
16. editor/autocomplete.js
```

---

# Configuration

TF-Engine uses four configuration levels.

Priority (lowest → highest):

```text
defaults.js
↓

config.js

↓

data-* attributes

↓

TFEngine.setConfig()
```

Most users should only edit **config.js**.

---

# JavaScript modules

## Core

Responsible for:

* initialization
* configuration
* events
* runtime API
* themes
* storage
* variables
* module loader

---

## Components

Each UI component is isolated in its own module.

Examples:

* Card
* Panel
* Badge
* Alert
* Tabs
* Infobox

Components register themselves automatically through the engine.

---

## Utilities

Shared helper modules used by every component.

Examples:

* DOM helpers
* Storage
* Theme manager
* Template helpers
* Animation helpers

---

## Editor

The editor is an optional module intended for MediaWiki editors.

Current architecture:

* editor.js
* diagnostics.js
* highlighter.js
* statistics.js
* outline.js
* autocomplete.js

Future versions aim to provide an editing experience similar to modern IDEs.

---

# Documentation

Documentation is available inside the `docs/` directory.

* Installation
* Usage
* Components
* Variables
* Configuration
* JavaScript API
* Editor

---

# License

TF-Engine is released under the MIT License.

See the LICENSE file for details.
