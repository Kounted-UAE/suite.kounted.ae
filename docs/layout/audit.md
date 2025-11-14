## Suite Layout Audit

### Key Components

- `components/react-layout/DashboardLayout.tsx`
  - Owns overall shell (top nav + sidebar + content) and decides the main flex layout.
  - Applies fixed positioning to `TopNavbar` and leaves the rest of the page responsible for compensating via manual margins (`ml-[5rem]` or `ml-[16rem]`).
  - Content `<main>` applies an inner shadow and no overflow constraints, allowing children to scroll under the sidebar.
  - No awareness of route-level padding or consistent page gutters.

- `components/react-layout/TopNavbar.tsx`
  - Fixed height `h-20` header rendered at the top of the viewport.
  - Left column width mirrors sidebar state, but the rest of the layout must manually account for that width.
  - Breadcrumbs and actions sit inside, but there is no provided API to add page-level actions.

- `components/react-layout/AppSidebar.tsx`
  - Fixed positioned sidebar beneath the top nav (`top-20`) with manual width toggles (`w-20` vs `w-64`).
  - ScrollArea handles vertical overflow, but there is no overlay/underlay when collapsed on mobile.
  - Toggle button exists per section but there is no global collapse trigger exposed to pages.
  - The fixed positioning plus lack of padding on content causes overlapping when the page scrolls horizontally.

- `components/react-layout/sidebar-context.tsx`
  - Provides expanded/collapsed state, cookie persistence, and keyboard shortcut.
  - `SidebarProvider` does not inject layout constraints; consumers must use `useSidebar` to adjust margins manually.

- `app/suite/layout.tsx`
  - Wraps pages with `DashboardLayout` inside `SidebarProvider`, but does not inject any per-page padding or wrappers.

### Observed Inconsistencies

- Horizontal scrolling in content pushes tables under the fixed sidebar because the content region does not clip overflow.
- Top nav and sidebar spacing relies on hard-coded Tailwind utilities scattered in pages, leading to unequal gaps between tabs/content and the sidebar edge.
- Repeated patterns (page headers, filters, action toolbars, tabs) are implemented ad-hoc in each page, resulting in varying heights, paddings, and alignment.
- Table behavior (sticky first column, sticky header, selection, inline actions) is partially implemented per page rather than through shared primitives.
- No common theme tokens for z-index, spacing, or width across layout elements, making it harder to guarantee consistent stacking order.

### Opportunities Identified

- Introduce a higher-level shell component (`SuiteShell`) that composes navbar, sidebar, and content with controlled CSS variables for widths and offsets.
- Provide standardized page sections (header, filters, action bar, tabs) so pages do not reimplement layout logic.
- Extend the table primitive with sticky header/column options and selection helpers to avoid duplicating logic on each page.
- Centralize constants for dimensions (top nav height, sidebar widths) and expose them via CSS variables or context to prevent drift.

These findings guide the normalization plan for unifying the layout and page composition patterns across the suite.

