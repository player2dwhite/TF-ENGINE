# Usage

TF-Engine is designed for Fandom (MediaWiki) wikis. It can be installed using
either a CDN import or by manually adding the compiled CSS to your wiki
stylesheet.

---

# 1. Installation on Fandom

## Method 1 — CDN Installation (Recommended)

The easiest way to install TF-Engine is using the GitHub CDN version.

Add this line at the top of your wiki stylesheet:

```css
@import url("https://cdn.jsdelivr.net/gh/player2dwhite/TF-ENGINE/css/tf-engine.css");
```

Place it inside:

```
MediaWiki:Common.css
```

After saving, refresh your wiki cache:

- Hard refresh:

```
Ctrl + Shift + R
```

- Or use:

```
?action=purge
```

Example:

```
https://yourwiki.fandom.com/wiki/Main_Page?action=purge
```

The CDN method automatically loads the latest version of TF-Engine from the
repository.

---

## Method 2 — Manual Installation

For full control, you can install TF-Engine manually.

Open:

```
css/tf-engine.css
```

Then combine the modules in this order:

```
variables.css
base.css
components.css
utilities.css
responsive.css
```

Paste the compiled CSS into:

```
MediaWiki:Common.css
```

The order must remain unchanged because each module depends on the previous one.

---

# 2. Basic Structure

All TF-Engine components should be placed inside a `.tf-engine` container.

Example:

```html
<div class="tf-engine">

<h2>Section Title</h2>

<p>
Normal text content.
</p>

<div class="tf-card tf-accent">

<span class="tf-badge tf-pl">
Active
</span>

<p>
Card content.
</p>

</div>

</div>
```

The `.tf-engine` container provides:

- CSS variables
- Theme support
- Typography
- Component styling
- Consistent colors and spacing

---

# 3. Components

Components are reusable UI elements using `tf-*` classes.

Example:

```html
<div class="tf-card">

<h3>Card Title</h3>

<p>
Card content.
</p>

</div>
```

Common components:

| Component | Class |
|---|---|
| Card | `.tf-card` |
| Panel | `.tf-panel` |
| Note | `.tf-note` |
| Badge | `.tf-badge` |
| Button | `.tf-btn` |
| Table | `.tf-table` |
| Alert | `.tf-alert` |
| Tabs | `.tf-tabs` |
| Infobox | `.tf-infobox` |

See `components.md` for the complete component reference.

---

# 4. Themes

Themes can be added next to `.tf-engine`.

Example:

```html
<div class="tf-engine tf-theme-blue">

Content

</div>
```

Available themes:

| Class | Description |
|---|---|
| `.tf-theme-light` | Light theme |
| `.tf-theme-blue` | Blue accent theme |
| `.tf-theme-red` | Red accent theme |
| `.tf-theme-green` | Green accent theme |

---

# 5. Utilities

Utilities are helper classes that modify layout, spacing, text, and colors.

Example:

```html
<div class="tf-card tf-p-4 tf-shadow tf-center">

Content

</div>
```

Common utilities:

| Category | Examples |
|---|---|
| Layout | `.tf-flex`, `.tf-grid`, `.tf-row` |
| Spacing | `.tf-p-*`, `.tf-mt-*`, `.tf-mb-*` |
| Text | `.tf-bold`, `.tf-uppercase`, `.tf-mono` |
| Colors | `.tf-ac`, `.tf-cr`, `.tf-pl`, `.tf-nt` |
| Display | `.tf-hidden`, `.tf-block`, `.tf-inline` |
| Position | `.tf-relative`, `.tf-absolute` |

---

# 6. Responsive Support

TF-Engine includes built-in responsive support.

Features:

- Responsive grids
- Mobile navigation support
- Desktop/mobile visibility helpers
- Print support

Example:

```html
<div class="tf-hidden-mobile">

Desktop only content

</div>
```

---

# 7. Repository Structure

```
TF-ENGINE/
│
├── css/
│   ├── tf-engine.css
│   ├── variables.css
│   ├── base.css
│   ├── components.css
│   ├── utilities.css
│   └── responsive.css
│
├── examples/
│
├── docs/
│
└── LICENSE
```

---

# 8. Updating TF-Engine

When using the CDN method:

- The wiki will load the latest version available in the repository.

When using manual installation:

- Replace the old CSS with the newest compiled version.

For stable production wikis, using a versioned release is recommended.
