from typing import Any


UI_CANDIDATES: dict[str, list[dict[str, Any]]] = {
    "calculator.compute": [
        {
            "widget_type": "calculator",
            "input_port": "result",
            "result_path": "$",
            "purpose": "show an evaluated expression and numeric result",
        }
    ],
    "calculator.score_options": [
        {
            "widget_type": "calculator",
            "input_port": "ranked",
            "result_path": "$.ranked",
            "purpose": "show ranked options from weighted scoring",
        }
    ],
    "calendar.list": [
        {
            "widget_type": "calendar",
            "input_port": "events",
            "result_path": "$.events",
            "purpose": "show upcoming calendar events",
        }
    ],
    "calendar.create": [
        {
            "widget_type": "calendar",
            "input_port": "event",
            "result_path": "$",
            "purpose": "show the created calendar event",
        }
    ],
    "calendar.list_reminders": [
        {
            "widget_type": "calendar",
            "input_port": "reminders",
            "result_path": "$.reminders",
            "purpose": "show upcoming reminders",
        }
    ],
    "contacts.search": [
        {
            "widget_type": "contacts",
            "input_port": "contacts",
            "result_path": "$.contacts",
            "purpose": "show matching people",
        }
    ],
    "contacts.get": [
        {
            "widget_type": "contacts",
            "input_port": "contact",
            "result_path": "$",
            "purpose": "show one person",
        }
    ],
    "contacts.list_groups": [
        {
            "widget_type": "contacts",
            "input_port": "groups",
            "result_path": "$.groups",
            "purpose": "show contact groups",
        }
    ],
    "files.list": [
        {
            "widget_type": "files",
            "input_port": "files",
            "result_path": "$.files",
            "purpose": "show stored files",
        }
    ],
    "files.get": [
        {
            "widget_type": "files",
            "input_port": "file",
            "result_path": "$",
            "purpose": "show one file record",
        }
    ],
    "forms.list": [
        {
            "widget_type": "forms",
            "input_port": "forms",
            "result_path": "$.forms",
            "purpose": "show available forms",
        }
    ],
    "forms.get": [
        {
            "widget_type": "forms",
            "input_port": "form",
            "result_path": "$",
            "purpose": "show one form definition",
        }
    ],
    "forms.list_responses": [
        {
            "widget_type": "forms",
            "input_port": "responses",
            "result_path": "$.responses",
            "purpose": "show submitted form responses",
        }
    ],
    "maps.search_places": [
        {
            "widget_type": "map",
            "input_port": "markers",
            "result_path": "$.places",
            "purpose": "show place search results geographically",
            "transform": "placesToMarkers",
        },
        {
            "widget_type": "search",
            "input_port": "results",
            "result_path": "$.places",
            "purpose": "show place search results as a list",
        },
    ],
    "maps.geocode": [
        {
            "widget_type": "map",
            "input_port": "markers",
            "result_path": "$.places",
            "purpose": "show geocoded places on a map",
            "transform": "placesToMarkers",
        }
    ],
    "maps.directions": [
        {
            "widget_type": "map",
            "input_port": "route",
            "result_path": "$",
            "purpose": "draw a route on the map",
            "transform": "directionsToRoute",
        }
    ],
    "messages.draft": [
        {
            "widget_type": "messages",
            "input_port": "draft",
            "result_path": "$",
            "purpose": "show a drafted message",
        }
    ],
    "messages.send": [
        {
            "widget_type": "messages",
            "input_port": "sent",
            "result_path": "$",
            "purpose": "show a sent-message receipt",
        }
    ],
    "messages.track_replies": [
        {
            "widget_type": "messages",
            "input_port": "tracking",
            "result_path": "$",
            "purpose": "show reply tracking state",
        }
    ],
    "notes.list": [
        {
            "widget_type": "notes",
            "input_port": "notes",
            "result_path": "$.notes",
            "purpose": "show notes",
        }
    ],
    "notes.get": [
        {
            "widget_type": "notes",
            "input_port": "note",
            "result_path": "$",
            "purpose": "show one note",
        }
    ],
    "search.web": [
        {
            "widget_type": "search",
            "input_port": "results",
            "result_path": "$.results",
            "purpose": "show web search result cards",
        }
    ],
    "tables.list": [
        {
            "widget_type": "table",
            "input_port": "table",
            "result_path": "$.tables[0]",
            "purpose": "show a table from the available structured tables",
        }
    ],
    "tables.create": [
        {
            "widget_type": "table",
            "input_port": "table",
            "result_path": "$",
            "purpose": "show the created structured table",
        }
    ],
    "tables.get": [
        {
            "widget_type": "table",
            "input_port": "table",
            "result_path": "$",
            "purpose": "show a full structured table",
        }
    ],
    "tasks.list": [
        {
            "widget_type": "tasks",
            "input_port": "tasks",
            "result_path": "$.tasks",
            "purpose": "show task records",
        }
    ],
    "tasks.create": [
        {
            "widget_type": "tasks",
            "input_port": "task",
            "result_path": "$",
            "purpose": "show the created task",
        }
    ],
    "tasks.get": [
        {
            "widget_type": "tasks",
            "input_port": "task",
            "result_path": "$",
            "purpose": "show one task",
        }
    ],
}


UI_ACTIONS: dict[str, list[dict[str, Any]]] = {
    "tables.get": [
        {
            "name": "addRow",
            "capability_id": "tables.add_row",
            "purpose": "append a row, then refresh the table binding",
            "refresh": ["table"],
        }
    ],
    "tasks.list": [
        {
            "name": "updateTask",
            "capability_id": "tasks.update",
            "purpose": "update a task, then refresh the task list",
            "refresh": ["tasks"],
        },
        {
            "name": "createTask",
            "capability_id": "tasks.create",
            "purpose": "create a task, then refresh the task list",
            "refresh": ["tasks"],
        },
        {
            "name": "deleteTask",
            "capability_id": "tasks.delete",
            "purpose": "delete a task, then refresh the task list",
            "refresh": ["tasks"],
        },
    ],
    "notes.list": [
        {
            "name": "createNote",
            "capability_id": "notes.create",
            "purpose": "create a note, then refresh the notes list",
            "refresh": ["notes"],
        },
        {
            "name": "updateNote",
            "capability_id": "notes.update",
            "purpose": "update a note, then refresh the notes list",
            "refresh": ["notes"],
        },
        {
            "name": "deleteNote",
            "capability_id": "notes.delete",
            "purpose": "delete a note, then refresh the notes list",
            "refresh": ["notes"],
        },
    ],
    "contacts.search": [
        {
            "name": "createContact",
            "capability_id": "contacts.create",
            "purpose": "create a contact, then refresh the contacts list",
            "refresh": ["contacts"],
        },
        {
            "name": "updateContact",
            "capability_id": "contacts.update",
            "purpose": "update a contact, then refresh the contacts list",
            "refresh": ["contacts"],
        },
        {
            "name": "deleteContact",
            "capability_id": "contacts.delete",
            "purpose": "delete a contact, then refresh the contacts list",
            "refresh": ["contacts"],
        },
    ],
    "contacts.list_groups": [
        {
            "name": "createGroup",
            "capability_id": "contacts.create_group",
            "purpose": "create a group, then refresh the groups list",
            "refresh": ["groups"],
        },
        {
            "name": "deleteGroup",
            "capability_id": "contacts.delete_group",
            "purpose": "delete a group, then refresh the groups list",
            "refresh": ["groups"],
        },
    ],
}


def enrich_capability(capability: dict[str, Any]) -> dict[str, Any]:
    capability_id = capability.get("id")
    if not isinstance(capability_id, str):
        return capability
    return {
        **capability,
        "ui_candidates": UI_CANDIDATES.get(capability_id, []),
        "ui_actions": UI_ACTIONS.get(capability_id, []),
    }
