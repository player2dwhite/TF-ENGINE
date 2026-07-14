# Variables

All variables reside in `src/variables.css`, inside the `:root` selector.  
They can be overridden per page or per section by wrapping content in a container with the corresponding theme class.

## Main Variable Groups

| Group | Variables | Usage |
|---|---|---|
| **Backgrounds / Surfaces** | `--bcg`, `--bg`, `--bg2`, `--bg3`, `--glass`, `--pn`, `--pn2` | Background colors for cards, panels, layers, and glass effects |
| **Text** | `--tx`, `--tt`, `--st`, `--ds`, `--mu` | Base text, titles, subtitles, descriptions, and muted text |
| **Accent / Branding** | `--ac`, `--ac2` | Primary accent color and hover accent color |
| **Semantic Colors** | `--cr`, `--pl`, `--pll`, `--nt`, `--ntl` | Critical, success, and warning states with light variants |
| **Links** | `--lk`, `--lk2` | Link color and hover state |
| **Extended Palette** | `--red`, `--green`, `--yellow`, `--purple`, `--cyan` | Additional colors for badges, labels, and custom states |
| **Borders** | `--bd`, `--ln`, `--bd2` | Normal borders, separators, and stronger outlines |
| **Border Radius** | `--rd`, `--rd-sm`, `--rd-lg`, `--rd-pill` | Radius scale for cards, buttons, badges, and pills |
| **Shadows / Depth** | `--sh`, `--ss`, `--is`, `--gl` | Standard shadows, soft shadows, inner shadows, and accent glow |
| **Typography** | `--ff`, `--ff-mono`, `--lh`, `--fw`, `--fw-b` | Font families, line height, and font weights |
| **Size Scale** | `--xs`, `--sm`, `--md`, `--lg`, `--xl` | Base spacing and sizing values |
| **States** | `--hover`, `--active`, `--disabled`, `--focus` | Interaction states and accessibility effects |
| **Z-index Layers** | `--z-dropdown`, `--z-modal`, `--z-tooltip`, `--z-toast` | Layer priority management |

## Themes

- `.tf-theme-light` / `[data-theme="light"]` — switches the engine to a light theme by overriding backgrounds, text, and borders.

- `.tf-theme-blue`, `.tf-theme-red`, `.tf-theme-green` — changes only the accent colors (`--ac` and `--ac2`) while keeping the rest of the theme unchanged.

Themes are applied by adding the class alongside `.tf-engine`:

```html
<div class="tf-engine tf-theme-light tf-theme-green">

...
</div>
