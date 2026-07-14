# TF-Engine

A pure CSS design system for Fandom wikis (MediaWiki), designed to
build cards, panels, tables, forms, and other UI components
directly in wikitext, using only `tf-*` classes.


## Repository structure

```
TF-ENGINE/
│
├── README.md
├── LICENSE
│
├── css/
│ ├── tf-engine.css ← compiled main file
│ ├── variables.css ← :root, themes, colors
│ ├── base.css ← reset, typography
│ ├── components.css ← cards, buttons, tabs, panels...
│ ├── utilities.css ← tf-flex, tf-mt, tf-p, etc.
│ └── responsive.css ← media queries
│
├── examples/
│ ├── index.html
│ ├── cards.html
│ ├── tabs.html
│ ├── infobox.html
│ └── dashboard.html
│
├── docs/
│ ├── components.md
│ ├── variables.md
│ └── usage.md
│
└── assets/ 
└── preview.png
```

## Installation in Fandom

1. Copy the content of `css/tf-engine.css` (or the modules 
individual, if you prefer to upload them separately) within 
`MediaWiki:Common.css` or `MediaWiki:Wiki.css` of your wiki.
2. Wrap your content in a `.tf-engine` container:

```html
<div class="tf-engine"> 
<h2>Title</h2> 
<div class="tf-card tf-accent"> 
<span class="tf-badge tf-accent">New</span> 
<p>Example content.</p> 
</div>
</div>
```

## CSS Modules

- **variables.css** — all custom properties (`:root`), settings 
of `prefers-reduced-motion` and themes (`tf-theme-light`, `tf-theme-blue`, 
`tf-theme-red`, `tf-theme-green`).
- **base.css** — base styles for `.tf-engine` (background, shadow, radii) and the typography (`h1-h3`, `p`, `a`, `code`, `pre`, `blockquote`).

- **components.css** — all components: cards, badges, tables, forms, tabs, modal, toast, infobox, stepper, FAB, etc.

- **utilities.css** — layout utilities (`tf-flex`, `tf-grid`), spacing, text, color, position, and other helpers in a single class.

- **responsive.css** — media queries for tablet/mobile and for printing.

See `docs/usage.md`, `docs/variables.md`, and `docs/components.md` for more details.

## License

TF-Engine is licensed under the MIT License.

See the [LICENSE](LICENSE) file for the full license text.
