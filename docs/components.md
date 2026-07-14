# Components

List of components defined in `css/components.css` and their main classes.

All components must be used inside a `.tf-engine` container.

---

## Content Components

| Component | Classes | Description |
|---|---|---|
| Card | `.tf-card` `.tf-card.tf-accent` | Main content cards and highlighted panels |
| Panel | `.tf-panel` | Secondary content container |
| Note | `.tf-note` | Informational highlighted note |
| Badge | `.tf-badge` `.tf-badge.tf-accent` `.tf-badge.tf-cr` `.tf-badge.tf-pl` `.tf-badge.tf-nt` | Labels, tags, and status indicators |
| Code | `.tf-code` | Code block styling |
| Divider | `.tf-divider` `.tf-divider.tf-glow` | Horizontal separators |
| Table | `.tf-table` `.tf-table-compact` `.tf-table-dark` `.tf-table-sortable` | Styled tables and variants |
| Media | `.tf-image` `.tf-avatar` | Images and avatar elements |
| States / Semantic | `.tf-success` `.tf-warning` `.tf-error` `.tf-info` | Success, warning, error, and information states |
| Collapsible | `.mw-collapsible` | MediaWiki collapsible integration |

---

## Interaction Components

| Component | Classes | Description |
|---|---|---|
| Button | `.tf-btn` `.tf-btn-primary` `.tf-btn-danger` | Action buttons |
| Chip / Pill | `.tf-chip` `.tf-pill` | Compact labels and tags |
| Alert / Banner | `.tf-alert` `.tf-banner` | Notification and announcement blocks |
| Hero | `.tf-hero` | Large featured section |
| Page Layout | `.tf-sidebar` `.tf-footer` `.tf-navbar` | Page structure components |
| Icon Wrapper | `.tf-icon` | Icon container |
| Gallery | `.tf-gallery` | Image gallery layout |
| Timeline | `.tf-timeline` `.tf-timeline-item` | Timeline displays |
| Progress Bar | `.tf-progress` `.tf-progress-bar` | Progress indicators |
| Tabs | `.tf-tabs` `.tf-tab` `.tf-tab-panel` | CSS tabs using `:target` |
| List | `.tf-list` `.tf-list-item` | Custom lists |
| Statistics | `.tf-stat` `.tf-stat-value` `.tf-stat-title` | Statistic cards |
| Dashboard | `.tf-dashboard` | Dashboard grid layout |

---

## Form Components

| Component | Classes | Description |
|---|---|---|
| Form | `.tf-form` | Form container |
| Field | `.tf-field` | Form field wrapper |
| Label | `.tf-label` | Form labels |
| Input | `.tf-input` | Text inputs |
| Textarea | `.tf-textarea` | Multi-line inputs |
| Select | `.tf-select` | Dropdown inputs |
| Checkbox | `.tf-checkbox` | Checkbox styling |
| Radio | `.tf-radio` | Radio button styling |
| Switch | `.tf-switch` | Toggle switch |
| Range | `.tf-range` | Range slider |
| Search | `.tf-search` | Search field wrapper |
| Input Group | `.tf-input-group` | Combined input elements |
| Button Group | `.tf-btn-group` | Grouped buttons |
| Pills | `.tf-pills` | Pill navigation group |

---

## Overlay Components

| Component | Classes | Description |
|---|---|---|
| Tooltip | `.tf-tooltip` | Hover information using `data-tooltip` |
| Dropdown | `.tf-dropdown` `.tf-dropdown-menu` | Dropdown menus |
| Modal | `.tf-modal` `.tf-modal-box` `.tf-modal-close` | Modal windows using `:target` |
| Toast | `.tf-toast` | Small notification messages |
| Spinner | `.tf-spinner` | Loading spinner |
| Skeleton | `.tf-skeleton` | Loading placeholder |

---

## Navigation Components

| Component | Classes | Description |
|---|---|---|
| Breadcrumb | `.tf-breadcrumb` | Navigation path indicator |
| Pagination | `.tf-pagination` | Page navigation controls |
| Tree View | `.tf-tree` | Hierarchical lists |
| Accordion | `.tf-accordion` | Expandable sections using `<details>` |

---

## Extra Components

| Component | Classes | Description |
|---|---|---|
| Card Header | `.tf-card-header` | Card header section |
| Card Body | `.tf-card-body` | Card content section |
| Card Footer | `.tf-card-footer` | Card footer section |
| Callout | `.tf-callout` | Highlighted information block |
| Infobox | `.tf-infobox` `.tf-infobox-header` `.tf-infobox-body` `.tf-infobox-footer` | Wiki-style information box |
| Tag | `.tf-tag` | Small category labels |
| Keyboard Key | `.tf-kbd` | Keyboard key display |
| Stepper | `.tf-stepper` `.tf-step` `.tf-step.tf-active` | Step progress component |
| Empty State | `.tf-empty` `.tf-empty-icon` | Empty content placeholder |
| Loading Screen | `.tf-loading` | Loading state container |
| Ribbon | `.tf-ribbon` | Corner banner decoration |
| Floating Action Button | `.tf-fab` | Floating action button |

---

## Usage Example

```html
<div class="tf-engine">

    <div class="tf-card tf-accent">
        <span class="tf-badge tf-accent">
            New
        </span>

        <h2>Example Card</h2>

        <p>
            Component example using TF-Engine.
        </p>
    </div>

</div>
```
