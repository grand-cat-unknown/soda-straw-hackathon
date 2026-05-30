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
