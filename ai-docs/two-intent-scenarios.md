# Two Intent Scenarios

These two scenarios should showcase reusability, personalization, and simplicity.

The user should feel like they are getting two very different custom apps. Underneath, the same deterministic OS tools are being reused.

## Scenario 1: Birthday Party

Intent:

> I want to host a 25-person birthday party in 4 weeks without it becoming a second job.

### Feel

This scenario should feel social, warm, and time-boxed. The main tension is not "can I produce the perfect event?" It is "can I host something great without turning my life into event operations?"

The generated interface should feel like a lightweight host command center:

- Guest list and RSVP tracker
- Budget snapshot
- Food and drink estimate
- Shopping list
- Prep timeline
- Vendor or venue comparison
- Message drafts
- Host load warnings

### Generated Modules

These are not underlying tools. They are generated interface modules assembled from the primitive tools.

Shared with the trip scenario:

- Budget
- Timeline
- People
- Messages
- Tasks
- Decisions
- Files

Party-exclusive:

- RSVP Tracker
- Food & Drink Estimate
- Shopping List
- Prep Timeline
- Host Load
- Venue/Vendor Comparison

### Shared Tools Used

| Tool | How It Is Used |
| --- | --- |
| `contacts` | Create a guest group; store dietary notes, plus-ones, relationships, and who can help |
| `forms` | Create an RSVP form with attendance, dietary needs, plus-one, and song/request fields |
| `messages` | Draft invites, reminders, RSVP follow-ups, and helper asks |
| `calendar` | Create party date, RSVP deadline, ordering deadlines, pickup times, setup reminders |
| `tasks` | Track invite, food, drinks, decor, playlist, cleaning, setup, and delegated work |
| `tables` | Maintain RSVP tracker, budget table, food/drink quantities, vendor options, shopping list |
| `calculator` | Estimate drinks, food portions, total cost, per-person cost, and prep time |
| `maps` | Compare venues, catering pickup distance, store runs, and guest travel constraints |
| `notes` | Store party brief, vibe, decisions, constraints, and open questions |
| `files` | Store menu PDFs, receipts, inspiration images, vendor quotes, playlist exports |
| `canvas` | Render a party dashboard, RSVP board, budget view, shopping checklist, and prep timeline |

### Example Agent Flow

1. Capture the intent brief in `notes`.
2. Create a guest group in `contacts`.
3. Create an RSVP form in `forms`.
4. Draft the invite in `messages`.
5. Add party date, RSVP deadline, and prep reminders in `calendar`.
6. Create RSVP, budget, vendor, and shopping tables in `tables`.
7. Use `calculator` to estimate food, drinks, and budget.
8. Create prep and delegation tasks in `tasks`.
9. Use `canvas` to render the "Birthday Party Command Center."

### Demo-Ready Version

Use this as the concrete demo prompt:

> Help me host a 25-person birthday dinner in Brussels on June 27. Keep it under EUR 900, make it casual but special, account for 4 vegetarians and 2 gluten-free guests, and reduce my prep load during the final week.

The demo should create a workspace called **Birthday Dinner Command Center**.

Demo modules that must be visible:

| Module | Backing Tools | Demo Purpose |
| --- | --- | --- |
| Guest List | `contacts`, `tables` | Show invitees, RSVP status, dietary notes, plus-ones, and helper flags |
| RSVP Tracker | `forms`, `tables` | Show the RSVP form mapped into a structured table |
| Budget | `tables`, `calculator` | Show budget categories, estimated cost, paid/unpaid status, and remaining budget |
| Food & Drink | `calculator`, `tables` | Show quantity estimates and dietary coverage |
| Shopping List | `tables`, `tasks` | Show grouped shopping items with owners and deadlines |
| Prep Timeline | `calendar`, `tasks` | Show time-boxed work from now through party day |
| Messages | `messages`, `contacts` | Show invite, reminder, and helper-ask drafts |
| Host Load | `calculator`, `tasks`, `canvas` | Show warnings when too many tasks land in the final week |

Minimum demo data:

- 8 seeded guests from `contacts`, plus a target capacity of 25.
- RSVP statuses: 11 yes, 5 maybe, 4 no, 5 pending.
- Dietary count: 4 vegetarian, 2 gluten-free.
- Budget categories: venue/home setup, food, drinks, dessert, decor, contingency.
- 3 vendor or venue options: home dinner, private room, catered picnic.
- 12 tasks grouped into invite, order, buy, prep, setup, cleanup.

Demo sequence:

1. User enters the intent prompt.
2. Agent creates a party note with constraints and vibe.
3. Agent creates or selects a guest group.
4. Agent creates an RSVP form and RSVP table.
5. Agent creates budget, food/drink, vendor, and shopping tables.
6. Agent calculates quantities and budget pressure.
7. Agent creates calendar deadlines and prep tasks.
8. Agent drafts the invite and one helper request.
9. Agent renders the Birthday Dinner Command Center.
10. User changes one constraint: "Make it 30 people and cap drinks at EUR 220."
11. Demo shows reactive updates: food/drink quantities, budget warning, shopping list, and host load all change.

### Connections Needed Eventually

For the hackathon demo, most of this can be simulated with the existing fake backend modules. The real integrations can come later.

| Connection | Needed For Demo? | Eventual Real Use |
| --- | --- | --- |
| Contacts provider | Nice to have | Pull real friends, groups, emails, and notes |
| Email/SMS/WhatsApp | No; draft only is enough | Send invites, reminders, helper asks, and RSVP follow-ups |
| Forms provider | No; fake form creation is enough | Publish RSVP form and collect responses |
| Calendar provider | No; fake events are enough | Create party date, deadlines, reminders, and setup blocks |
| Maps/place search | Nice to have | Compare venues, stores, catering pickup distance, and guest travel |
| Files/Drive | No | Store receipts, menus, vendor PDFs, inspiration |
| Payments/splitwise | No | Track deposits, shared costs, and reimbursement |

Build priority for a quick demo:

1. `tables`, `canvas`, `calculator`, and `tasks` must be polished.
2. `contacts`, `forms`, `messages`, and `calendar` should return believable structured data.
3. `maps`, `files`, and `search` can be present as supporting tools but do not need to be perfect.

### Example Generated Interface

The user does not see raw tools. They see something like:

- "Guest List"
- "RSVPs"
- "Budget"
- "Food & Drinks"
- "Shopping"
- "Prep Timeline"
- "Messages"
- "Decisions"

This interface is temporary. It exists because this intent needs it.

### Party-Specific Personalization From Generic Tools

There is no `partyPlanner` tool. The party-specific feeling comes from:

- Tables shaped as RSVP trackers and shopping lists.
- Calendar entries shaped as party deadlines.
- Messages shaped as invites and reminders.
- Calculator calls shaped as drink and food estimates.
- Canvas views named and arranged for hosting.

## Scenario 2: September Trip

Intent:

> I want to plan a 10-day trip in September that feels personal, not over-scheduled.

### Feel

This scenario should feel exploratory, personal, and paced. The main tension is not "can I fill every day?" It is "can I make the trip feel intentional while leaving enough room to breathe?"

The generated interface should feel like a trip planning board:

- Date range and travel calendar
- Map of saved places
- Lodging shortlist
- Activity shortlist
- Booking tracker
- Day-by-day itinerary
- Budget snapshot
- Packing and documents checklist
- Over-scheduling warnings

### Generated Modules

These are not underlying tools. They are generated interface modules assembled from the primitive tools.

Shared with the party scenario:

- Budget
- Timeline
- People
- Messages
- Tasks
- Decisions
- Files

Trip-exclusive:

- Trip Map
- Lodging Shortlist
- Activity Shortlist
- Booking Tracker
- Day-by-Day Itinerary
- Packing & Documents
- Pacing Warnings

### Shared Tools Used

| Tool | How It Is Used |
| --- | --- |
| `calendar` | Create travel dates, reservation holds, booking deadlines, daily itinerary blocks |
| `contacts` | Store travel companions, emergency contacts, shared preferences, accessibility needs |
| `messages` | Draft coordination messages, itinerary shares, booking confirmations, preference polls |
| `tasks` | Track passport, bookings, packing, reservations, payments, research, and pre-trip errands |
| `tables` | Maintain lodging options, activity shortlist, restaurant list, booking tracker, budget |
| `notes` | Store trip brief, travel style, must-sees, avoid-list, decisions, research summaries |
| `files` | Store tickets, confirmations, passport scan, travel insurance, maps, reservation PDFs |
| `search` | Find flights, lodging, restaurants, museums, neighborhoods, events, local guides |
| `maps` | Save places, estimate travel times, cluster days by neighborhood, detect bad routing |
| `calculator` | Calculate budget, daily spend, travel times, pacing, and option scores |
| `forms` | Gather companion preferences, date constraints, budget comfort, activity votes |
| `canvas` | Render a trip board, map view, booking tracker, itinerary, and packing checklist |

### Example Agent Flow

1. Capture the trip brief in `notes`.
2. Create the travel date range in `calendar`.
3. Create lodging, activity, restaurant, booking, and budget tables in `tables`.
4. Use `search` to find initial options.
5. Use `maps` to cluster saved places and estimate travel time.
6. Use `calculator` to score options against budget, location, and pacing.
7. Create booking, packing, and document tasks in `tasks`.
8. Store confirmations and important documents in `files`.
9. Use `canvas` to render the "September Trip Planning Board."

### Demo-Ready Version

Use this as the concrete demo prompt:

> Plan a 10-day September trip to Lisbon and Porto for two people. We like design, food, walking neighborhoods, and one beach day. Keep lodging plus activities under EUR 2,400, avoid over-scheduling, and leave two flexible evenings.

The demo should create a workspace called **Portugal September Trip Board**.

Demo modules that must be visible:

| Module | Backing Tools | Demo Purpose |
| --- | --- | --- |
| Trip Brief | `notes` | Show dates, cities, preferences, budget, pace, and constraints |
| Trip Map | `maps`, `tables`, `canvas` | Show saved places and city/neighborhood clusters |
| Lodging Shortlist | `search`, `maps`, `tables`, `calculator` | Compare stays by cost, location, transit, and fit |
| Activity Shortlist | `search`, `maps`, `tables` | Show restaurants, museums, neighborhoods, day trips, and beach options |
| Itinerary | `calendar`, `tables`, `calculator` | Show day-by-day plan with open blocks |
| Booking Tracker | `tables`, `tasks`, `files` | Show booking status, confirmation files, deadlines, and owners |
| Budget | `tables`, `calculator` | Show lodging, activities, food estimate, transit, and remaining budget |
| Packing & Documents | `tasks`, `files` | Show passport, insurance, charger, beach day, and walking gear checklist |
| Pacing Warnings | `calculator`, `calendar`, `canvas` | Show over-scheduled days and route inefficiency |

Minimum demo data:

- 10 calendar days in September.
- 2 cities: Lisbon for 6 nights, Porto for 4 nights.
- 5 lodging options with cost, area, walkability, cancellation, and score.
- 12 saved places across food, design, museum, viewpoint, beach, and day trip categories.
- 1 route check between two places.
- 1 intentionally overloaded day so the pacing warning has something to fix.
- 8 booking/document tasks.

Demo sequence:

1. User enters the intent prompt.
2. Agent creates a trip brief note.
3. Agent creates date range and placeholder itinerary days.
4. Agent creates lodging, activity, booking, and budget tables.
5. Agent searches or loads sample places and stays.
6. Agent maps places into Lisbon and Porto clusters.
7. Agent calculates lodging scores, budget pressure, and day pacing.
8. Agent creates booking, packing, and document tasks.
9. Agent renders the Portugal September Trip Board.
10. User changes one constraint: "Add one more beach day but keep two flexible evenings."
11. Demo shows reactive updates: itinerary, map clusters, pacing warning, and activity shortlist change.

### Connections Needed Eventually

For the hackathon demo, use deterministic seed data for search and files, and use Mapbox only if it is already configured. The important demo point is the workspace assembly, not perfect live travel search.

| Connection | Needed For Demo? | Eventual Real Use |
| --- | --- | --- |
| Search provider | Nice to have | Find current stays, activities, restaurants, events, and guides |
| Maps provider | Yes if showing a live map; otherwise seed coordinates | Geocode places, estimate travel times, cluster days, route checks |
| Calendar provider | No; fake calendar is enough | Create trip dates, reservation holds, daily itinerary blocks |
| Email/Gmail | No | Parse confirmations and draft itinerary shares |
| Drive/files | No | Store tickets, reservations, passport scan, insurance, maps |
| Booking APIs | No | Pull live lodging, flight, train, restaurant, and event options |
| Weather | No | Improve beach day and packing recommendations |

Build priority for a quick demo:

1. `maps`, `tables`, `canvas`, and `calculator` must be polished.
2. `calendar`, `tasks`, `notes`, and `files` should support the itinerary and checklist story.
3. `search`, `messages`, and `forms` can be present but mostly simulated.

### Example Generated Interface

The user does not see raw tools. They see something like:

- "Map"
- "Itinerary"
- "Stays"
- "Food"
- "Activities"
- "Bookings"
- "Budget"
- "Packing"
- "Documents"

This interface is temporary. It exists because this intent needs it.

### Trip-Specific Personalization From Generic Tools

There is no `tripPlanner` tool. The trip-specific feeling comes from:

- Tables shaped as lodging shortlists and booking trackers.
- Calendar entries shaped as travel days and reservations.
- Maps shaped as neighborhood clusters and route checks.
- Calculator calls shaped as pacing and budget tradeoffs.
- Canvas views named and arranged for travel planning.

## Reuse Comparison

| Capability | Birthday Party | September Trip | Same Tool? |
| --- | --- | --- | --- |
| People | Guest list, RSVPs, helpers | Companions, emergency contacts | `contacts` |
| Time | Party date, RSVP deadline, prep schedule | Travel dates, reservations, daily itinerary | `calendar` |
| Communication | Invites, reminders, helper asks | Coordination, shared itinerary, preference polls | `messages` |
| Structured tracking | RSVPs, budget, shopping, vendors | Lodging, activities, bookings, budget | `tables` |
| Work management | Prep, ordering, setup, cleanup | Booking, packing, documents, errands | `tasks` |
| Discovery | Venues, vendors, stores | Flights, stays, restaurants, activities | `search`, `maps` |
| Math | Food/drink quantities, cost per person | Daily spend, travel time, pacing | `calculator` |
| Memory | Party brief, vibe, decisions | Trip brief, preferences, decisions | `notes` |
| Artifacts | Receipts, menus, inspiration | Tickets, confirmations, passport scan | `files` |
| Interface | Party command center | Trip planning board | `canvas` |

## Demo Point

The strongest demo is to show the same low-level tools being called, then reveal two very different generated interfaces.

The party should feel like hosting.

The trip should feel like exploring.

The OS should feel simple because the user only states the intent. The agent assembles the workspace from reusable deterministic blocks.

## Quick Hackathon Demo Scope

The smallest convincing implementation is two scripted intents that both call the same primitive modules and then render different canvases.

Required backend modules:

- `notes`
- `contacts`
- `forms`
- `messages`
- `calendar`
- `tasks`
- `tables`
- `calculator`
- `maps`
- `files`
- `search`
- `canvas`

Required frontend modules:

- Chat or intent input
- Tool trace panel
- Workspace canvas renderer
- Table widget
- Map widget
- Generic summary/result widget
- Dependency graph or visible module connections

Demo script:

1. Run party prompt.
2. Show tool trace: `notes`, `contacts`, `forms`, `tables`, `calculator`, `tasks`, `calendar`, `messages`, `canvas`.
3. Show party workspace.
4. Change party constraint and show connected modules update.
5. Run trip prompt.
6. Show tool trace: `notes`, `calendar`, `tables`, `search`, `maps`, `calculator`, `tasks`, `files`, `canvas`.
7. Show trip workspace.
8. Change trip constraint and show connected modules update.
9. Close by pointing out that RSVP Tracker and Trip Map are generated modules, not hardcoded tools.

What must be real:

- The tool catalog.
- The tool calls.
- The generated canvas specs.
- The visible dependency graph between widgets.
- The table/map/widget rendering.

What can be simulated:

- Contact data.
- RSVP responses.
- Search results.
- Vendor and lodging options.
- File attachments.
- Message sending.
- Calendar sync.

What needs real credentials only if time allows:

- `MAPBOX_TOKEN` for live maps and route checks.
- Soda Straw API key for syncing tools into the hosted workspace.
- Optional messaging/calendar/file provider credentials.
