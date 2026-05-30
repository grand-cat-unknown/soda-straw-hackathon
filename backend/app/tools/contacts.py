from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

tool_name = "contacts"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class Contact(BaseModel):
    id: str
    name: str
    relationship: str
    tags: list[str] = Field(default_factory=list)
    city: str
    email: str | None = None
    phone: str | None = None
    preferences: dict[str, Any] | None = None
    constraints: dict[str, Any] | None = None
    notes: str | None = None


class ContactCreate(BaseModel):
    name: str
    relationship: str = "contact"
    tags: list[str] = Field(default_factory=list)
    city: str = ""
    email: str | None = None
    phone: str | None = None
    preferences: dict[str, Any] | None = None
    constraints: dict[str, Any] | None = None
    notes: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    relationship: str | None = None
    tags: list[str] | None = None
    city: str | None = None
    email: str | None = None
    phone: str | None = None
    preferences: dict[str, Any] | None = None
    constraints: dict[str, Any] | None = None
    notes: str | None = None


class ContactsResponse(BaseModel):
    contacts: list[Contact]


class GroupCreate(BaseModel):
    name: str
    person_ids: list[str]
    linked_intent_id: str | None = None


class Group(BaseModel):
    id: str
    name: str
    person_ids: list[str]
    linked_intent_id: str | None = None


class GroupsResponse(BaseModel):
    groups: list[Group]


contacts: list[Contact] = [
    Contact(id="c_001", name="Maya Rao", relationship="close friend", tags=["friends", "design"], city="Brussels"),
    Contact(id="c_002", name="Leo Martins", relationship="friend", tags=["friends", "music"], city="Brussels"),
    Contact(id="c_003", name="Aisha Khan", relationship="coworker", tags=["work", "food"], city="Ghent"),
    Contact(id="c_004", name="Jonas Peeters", relationship="neighbor", tags=["neighbors"], city="Brussels"),
    Contact(id="c_005", name="Nina Verma", relationship="close friend", tags=["friends", "planning"], city="Antwerp"),
    Contact(id="c_006", name="Tom Jacobs", relationship="friend", tags=["friends", "drinks"], city="Brussels"),
]

groups: list[Group] = []


capabilities = [
    {
        "id": "contacts.search",
        "tool": "contacts",
        "name": "Search Contacts",
        "description": "Find people by name, relationship, city, or tag.",
        "method": "GET",
        "endpoint": "/contacts",
        "output_model": "ContactsResponse",
        "tags": ["people", "planning"],
    },
    {
        "id": "contacts.get",
        "tool": "contacts",
        "name": "Get Contact",
        "description": "Fetch one contact by ID.",
        "method": "GET",
        "endpoint": "/contacts/{contact_id}",
        "output_model": "Contact",
        "tags": ["people"],
    },
    {
        "id": "contacts.create",
        "tool": "contacts",
        "name": "Create Contact",
        "description": "Create a new person.",
        "method": "POST",
        "endpoint": "/contacts",
        "input_model": "ContactCreate",
        "output_model": "Contact",
        "tags": ["people", "action"],
    },
    {
        "id": "contacts.update",
        "tool": "contacts",
        "name": "Update Contact",
        "description": "Update fields on an existing person.",
        "method": "PATCH",
        "endpoint": "/contacts/{contact_id}",
        "input_model": "ContactUpdate",
        "output_model": "Contact",
        "tags": ["people", "action"],
    },
    {
        "id": "contacts.create_group",
        "tool": "contacts",
        "name": "Create Group",
        "description": "Create a named group of people.",
        "method": "POST",
        "endpoint": "/contacts/groups",
        "input_model": "GroupCreate",
        "output_model": "Group",
        "tags": ["people", "action"],
    },
    {
        "id": "contacts.list_groups",
        "tool": "contacts",
        "name": "List Groups",
        "description": "List people groups.",
        "method": "GET",
        "endpoint": "/contacts/groups",
        "output_model": "GroupsResponse",
        "tags": ["people"],
    },
]


@router.get("", response_model=ContactsResponse)
def search_contacts(q: str | None = Query(default=None, description="Search text for name, relationship, city, or tag.")):
    if not q:
        return ContactsResponse(contacts=contacts)

    query = q.lower()
    matches = [
        contact
        for contact in contacts
        if query in " ".join([contact.name, contact.relationship, contact.city, *contact.tags]).lower()
    ]
    return ContactsResponse(contacts=matches)


@router.post("", response_model=Contact, status_code=201)
def create_contact(payload: ContactCreate):
    contact = Contact(id=f"c_{len(contacts) + 1:03d}", **payload.model_dump())
    contacts.append(contact)
    return contact


@router.get("/groups", response_model=GroupsResponse)
def list_groups():
    return GroupsResponse(groups=groups)


@router.post("/groups", response_model=Group, status_code=201)
def create_group(payload: GroupCreate):
    group = Group(id=f"grp_{len(groups) + 1:03d}", **payload.model_dump())
    groups.append(group)
    return group


@router.get("/{contact_id}", response_model=Contact)
def get_contact(contact_id: str):
    for contact in contacts:
        if contact.id == contact_id:
            return contact
    raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")


@router.patch("/{contact_id}", response_model=Contact)
def update_contact(contact_id: str, payload: ContactUpdate):
    for index, contact in enumerate(contacts):
        if contact.id != contact_id:
            continue
        updated = contact.model_copy(update=payload.model_dump(exclude_unset=True))
        contacts[index] = updated
        return updated
    raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
