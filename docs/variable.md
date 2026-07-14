# Variables

All variables reside in `src/variables.css`, inside the `:root` selector.  
They can be overridden per page or section by wrapping content in a container with the corresponding theme class.

## Main Variable Groups

| Group | Variables | Usage |
|---|---|---|
| **Backgrounds / Surfaces** | `--bcg`, `--bg`, `--bg2`, `--bg3`, `--glass`, `--pn`, `--pn2` | Main backgrounds, panels, cards, and transparent layers |
| **Text Colors** | `--tx`, `--tt`, `--st`, `--ds`, `--mu` | Primary text, titles, subtitles, descriptions, and muted text |
| **Accent Colors** | `--ac`, `--ac2` | Primary brand color and hover accent |
| **Semantic Colors** | `--cr`, `--crl`, `--cr-tx`, `--pl`, `--pll`, `--nt`, `--ntl`, `--infol` | Error, success, warning, and informational states |
| **Links** | `--lk`, `--lk2` | Link color and hover link color |
| **Extra Palette** | `--red`, `--green`, `--yellow`, `--purple`, `--cyan` | Additional colors for custom components and badges |
| **Borders** | `--bd`, `--ln`, `--bd2` | Normal borders, separators, and strong borders |
| **Border Radius** | `--rd`, `--rd-sm`, `--rd-lg`, `--rd-pill` | Rounded corners for UI elements |
| **Shadows / Depth** | `--sh`, `--ss`, `--is`, `--gl`, `--e1`, `--e2`, `--e3` | Shadows, inner shadows, glow effects, and elevation levels |
| **Typography** | `--ff`, `--ff-mono`, `--lh`, `--fw`, `--fw-b` | Font family, monospace font, line height, and font weights |
| **Size Scale** | `--xs`, `--sm`, `--md`, `--lg`, `--xl` | Base spacing and sizing values |
| **Spacing** | `--pd`, `--pd-card`, `--gp`, `--mg` | Default padding, card padding, gaps, and margins |
| **Interaction States** | `--hover`, `--active`, `--disabled`, `--focus` | Hover, active, disabled, and focus effects |
| **Tables** | `--table-head`, `--table-row1`, `--table-row2`, `--table-padding`, `--table-radius`, `--table-border`, `--th-line` | Table colors, spacing, borders, and headers |
| **Media** | `--fit`, `--pos`, `--icon-size`, `--avatar-size`, `--image-radius` | Image fitting, positioning, icons, avatars, and media sizing |
| **Transitions / Animation** | `--tr-fast`, `--tr-normal`, `--ease`, `--anim-fast`, `--anim`, `--anim-slow` | Animation timing and transitions |
| **Layout Tokens** | `--flex`, `--grid`, `--wrap`, `--center`, `--pointer`, `--full`, `--auto`, `--none` | Reusable layout values |
| **Layout Sizing** | `--content-width`, `--hero-height`, `--card-width`, `--container-width` | Component and container sizing |
| **Blur / Effects** | `--blur`, `--noise-opacity` | Glass effects and background noise |
| **Z-index Layers** | `--z-dropdown`, `--z-modal`, `--z-tooltip`, `--z-toast` | Layer priority management |
| **Borders Configuration** | `--bw`, `--bw2`, `--bs` | Border width and style helpers |
| **Component Defaults** | `--btn-padding`, `--btn-radius`, `--btn-font`, `--card-padding`, `--card-radius`, `--card-shadow` | Default button and card styling |

## Themes

- `.tf-theme-light` / `[data-theme="light"]` — overrides the default dark theme variables with lighter backgrounds, text colors, and borders.

- `.tf-theme-blue`, `.tf-theme-red`, `.tf-theme-green` — changes only the accent variables (`--ac` and `--ac2`) while keeping the rest of the theme unchanged.

Themes are applied by adding the class next to `.tf-engine`:

```html
<div class="tf-engine tf-theme-light tf-theme-green">

...
</div>
