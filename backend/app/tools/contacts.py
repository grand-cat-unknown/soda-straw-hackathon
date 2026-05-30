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
    country: str = "Belgium"
    lat: float | None = None
    lng: float | None = None
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
    country: str = "Belgium"
    lat: float | None = None
    lng: float | None = None
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
    country: str | None = None
    lat: float | None = None
    lng: float | None = None
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
    Contact(id="c_001", name="Maya Rao", relationship="high school friend", tags=["friends", "high school", "design"], city="Brussels", lat=50.8503, lng=4.3517),
    Contact(id="c_002", name="Leo Martins", relationship="high school friend", tags=["friends", "high school", "music"], city="Brussels", lat=50.8466, lng=4.3528),
    Contact(id="c_003", name="Aisha Khan", relationship="colleague", tags=["colleagues", "food"], city="Ghent", lat=51.0543, lng=3.7174),
    Contact(id="c_004", name="Jonas Peeters", relationship="high school friend", tags=["friends", "high school", "neighbors"], city="Brussels", lat=50.8550, lng=4.3753),
    Contact(id="c_005", name="Nina Verma", relationship="high school friend", tags=["friends", "high school", "planning"], city="Antwerp", lat=51.2194, lng=4.4025),
    Contact(id="c_006", name="Tom Jacobs", relationship="high school friend", tags=["friends", "high school", "drinks"], city="Bruges", lat=51.2093, lng=3.2247),
    Contact(id="c_007", name="Sofia Laurent", relationship="university friend", tags=["friends", "university", "art"], city="Brussels", lat=50.8428, lng=4.3517),
    Contact(id="c_008", name="Bram De Smet", relationship="colleague", tags=["colleagues", "operations"], city="Antwerp", lat=51.2213, lng=4.4051),
    Contact(id="c_009", name="Eleni Costa", relationship="university friend", tags=["friends", "university", "travel"], city="Leuven", lat=50.8798, lng=4.7005),
    Contact(id="c_010", name="Samira Benali", relationship="colleague", tags=["colleagues", "product"], city="Brussels", lat=50.8371, lng=4.3676),
    Contact(id="c_011", name="Oscar Dubois", relationship="university friend", tags=["friends", "university", "sports"], city="Namur", lat=50.4674, lng=4.8718),
    Contact(id="c_012", name="Priya Nair", relationship="colleague", tags=["colleagues", "research"], city="Ghent", lat=51.0499, lng=3.7303),
]

groups: list[Group] = []


capabilities = [
    {
        "id": "contacts.search",
        "tool": "contacts",
        "name": "Search Contacts",
        "description": "Find people by name, relationship, city, or tag. Optional query params: q for free-text search, tag for one tag, or tags for one or more tags.",
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
    {
        "id": "contacts.delete",
        "tool": "contacts",
        "name": "Delete Contact",
        "description": "Delete a contact by ID.",
        "method": "DELETE",
        "endpoint": "/contacts/{contact_id}",
        "tags": ["people", "action"],
    },
    {
        "id": "contacts.delete_group",
        "tool": "contacts",
        "name": "Delete Group",
        "description": "Delete a group by ID.",
        "method": "DELETE",
        "endpoint": "/contacts/groups/{group_id}",
        "tags": ["people", "action"],
    },
]


def normalize_tag(value: str) -> str:
    return value.strip().lower()


@router.get("", response_model=ContactsResponse)
def search_contacts(
    q: str | None = Query(default=None, description="Search text for name, relationship, city, or tag."),
    tag: str | None = Query(default=None, description="Optional single tag to filter contacts by."),
    tags: list[str] = Query(default_factory=list, description="Optional repeated tags to filter contacts by. Matches contacts that have any requested tag."),
):
    requested_tags = {normalize_tag(item) for item in tags if normalize_tag(item)}
    if tag and normalize_tag(tag):
        requested_tags.add(normalize_tag(tag))

    query = q.lower().strip() if q else None
    matches = contacts

    if requested_tags:
        matches = [
            contact
            for contact in matches
            if requested_tags.intersection(normalize_tag(item) for item in contact.tags)
        ]

    if query:
        matches = [
            contact
            for contact in matches
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


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: str):
    for index, contact in enumerate(contacts):
        if contact.id == contact_id:
            del contacts[index]
            return
    raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")


@router.delete("/groups/{group_id}", status_code=204)
def delete_group(group_id: str):
    for index, group in enumerate(groups):
        if group.id == group_id:
            del groups[index]
            return
    raise HTTPException(status_code=404, detail=f"Group {group_id} not found.")
