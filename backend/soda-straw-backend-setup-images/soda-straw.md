# Soda Straw — Straws Page

Screenshot of the Soda Straw web UI for user `srikanthganta`, viewing the
**Straws** management page.

## Layout

### Left sidebar
- Workspace switcher at top: **Soda Straw / srikanthganta**
- Primary nav:
  - Home
  - **Straws** (selected)
  - Agents
- Bottom widgets:
  - **Loop Challenge** card — "Ready to submit" with a yellow **Submit** button
  - **Connected** status card (green) — "Show install command"
  - Invite your team
  - Settings
  - Report an issue

### Main panel — "Straws"
- Top bar: search input (`Search straws…`) and **+ Add straw** button (top right)
- Filter tabs: **All** (selected), Active, Authorization required, Disconnected, Owned by me
- Grouped section header: **Owned by me**
- Columns: Name, Type, My access, User access, Agent access, Owner, Connection

### Rows
All rows share the same shape:
- Type: `API · Bearer token`
- My access: `R/W`
- User access: `FULL`
- Owner: `Srikanth`
- Connection: **Active** (green dot)

Visible straws (all `fluid-os-*` mock APIs exposed through a static ngrok backend):

| # | Name |
|---|------|
| 1 | fluid-os-calculator *(tooltip shown: "Fluid OS mock calculator API exposed through the static ngrok backend.")* |
| 2 | fluid-os-calendar |
| 3 | fluid-os-canvas |
| 4 | fluid-os-contacts |
| 5 | fluid-os-files |
| 6 | fluid-os-forms |
| 7 | fluid-os-maps |
| 8 | fluid-os-messages |
| 9 | fluid-os-notes |
| 10 | fluid-os-search |
| 11 | fluid-os-shadcn |
| 12 | fluid-os-tables |
| 13 | fluid-os-tasks *(partially visible at bottom)* |

### Footer
- Chat input: **Ask Soda Straw…** with a **Straws** scope selector

## Notes
The set of straws mirrors the Fluid OS widget catalog (contacts, calendar,
tasks, notes, tables, maps, messages, files, forms, search, calculator, plus
canvas and shadcn), each wired as an individual API straw so an agent can be
granted scoped access per capability.
