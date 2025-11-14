## Suite Layout Usage Guide

This document explains how to use the normalized layout system introduced with `SuiteShell` and its companion components.

### Shell & Providers

- `app/suite/layout.tsx` wraps pages in `AppProviders` → `SidebarProvider` → `DashboardLayout`.
- `DashboardLayout` now delegates to `SuiteShell`, which renders the fixed `TopNavbar`, `AppSidebar`, and constrained content area.
- `SuiteShell` exposes CSS variables:
  - `--suite-top-nav-height`
  - `--suite-sidebar-width`
  - `--suite-content-gutter-{x|y}`
  These ensure that page content never scrolls under navigation elements.

### Page Structure Building Blocks

- `PageHeader`: use for page titles, descriptions, breadcrumbs, and pinned actions.
- `FilterBar`: wraps search & filter controls with consistent spacing and responsive wrapping.
- `ActionToolbar`: hosts contextual actions (bulk operations, pagination) with optional subdued styling.
- `TabbedSection`: standardizes tab lists and per-tab actions. Use `TabbedSectionContent` for panel markup.

### Data Table Enhancements

- `DataTable`: context wrapper around the base table primitives that enables sticky headers, selectable rows, and sticky first columns.
- Utility components:
  - `DataTableRow`, `DataTableCheckboxCell`, `DataTableHeaderCheckbox`
  - `StickyHeadCell`, `StickyCell` with configurable offsets
  - `EditableCell` for double-click to edit interactions.
- Pass `selectable`, `allRowIds`, and `rowCount` when selection is required. `stickyColumnWidth` controls the pinned column width.

### Theme & Constants

- Shared dimensions live in `components/react-layout/layout-constants.ts`:
  - `TOP_NAV_HEIGHT`, `SIDEBAR_WIDTH_EXPANDED`, `SIDEBAR_WIDTH_COLLAPSED`
  - `CONTENT_GUTTER_X`, `CONTENT_GUTTER_Y`
- Adjust these constants to change the layout globally.

### Accessibility & Responsiveness

- `SidebarProvider` keeps collapse state, handles keyboard shortcut (`⌘/Ctrl + b`), and ensures mobile compatibility.
- All new components use semantic HTML and respect keyboard focus states from the existing design system.

### Migration Tips

- Remove legacy `container` wrappers in suite pages; `SuiteShell` manages width and gutters.
- Replace ad-hoc headings or filter toolbars with the standardized components.
- Gradually move existing tables to `DataTable` to take advantage of selection and sticky column behavior.
- Document bespoke patterns next to the component that implements them to keep the system cohesive.

