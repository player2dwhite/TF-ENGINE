# Variables

All variables reside in `css/variables.css`, within `:root`, and can be overridden per page or per section by wrapping the content in a container with the corresponding theme class.

## Main Groups

| Group | Variables | Usage |

---|---|---|

| Backgrounds / Surfaces | `--bcg`, `--bg`, `--bg2`, `--bg3`, `--glass`, `--pn`, `--pn2` | Backgrounds for cards, panels, and layers |

| Text | `--tx`, `--tt`, `--st`, `--ds`, `--mu` | Base text, titles, subtitles, descriptions, and off text |

| Accent / Markup | `--ac`, `--ac2` | Primary and hover colors |

| Semantic | `--cr`, `--pl`/`--pll`, `--nt`/`--ntl` | Critical, Positive, Warning (with clear variant) |

Links | `--lk`, `--lk2` | Link and hover color |

| Free palette | `--red`, `--green`, `--yellow`, `--purple`, `--cyan` | For new badges/statuses |

| Borders | `--bd`, `--ln`, `--bd2` | Subtle border, line, hard border |

| Radii | `--rd`, `--rd-sm`, `--rd-lg`, `--rd-pill` | Border-radius scale |

| Shadows | `--sh`, `--ss`, `--is`, `--gl` | Standard shadow, soft shadow, inner shadow, glow shadow |

Typography | `--ff`, `--ff-mono`, `--lh`, `--fw`, `--fw-b` | Family, line spacing, weights |

| Size scaling | `--xs`, `--sm`, `--md`, `--lg`, `--xl` | Spacing base |

| States | `--hover`, `--active`, `--disabled`, `--focus` | Interaction overlays |

| Z-index | `--z-dropdown`, `--z-modal`, `--z-tooltip`, `--z-toast` | Layer scaling |

## Themes

- `.tf-theme-light` / `[data-theme="light"]` — inverts backgrounds and text for light mode.

- `.tf-theme-blue`, `.tf-theme-red`, `.tf-theme-green` — only change the `--ac`/`--ac2` attributes, keeping the rest of the theme.

Themes are applied by adding the class next to `.tf-engine`:

```html
<div class="tf-engine tf-theme-light tf-theme-green">

...
</div>
```
