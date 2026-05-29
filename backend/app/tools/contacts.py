from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/contacts", tags=["contacts"])


class Contact(BaseModel):
    id: str
    name: str
    relationship: str
    tags: list[str]
    city: str


class ContactsResponse(BaseModel):
    contacts: list[Contact]


contacts = [
    Contact(id="c_001", name="Maya Rao", relationship="close friend", tags=["friends", "design"], city="Brussels"),
    Contact(id="c_002", name="Leo Martins", relationship="friend", tags=["friends", "music"], city="Brussels"),
    Contact(id="c_003", name="Aisha Khan", relationship="coworker", tags=["work", "food"], city="Ghent"),
    Contact(id="c_004", name="Jonas Peeters", relationship="neighbor", tags=["neighbors"], city="Brussels"),
    Contact(id="c_005", name="Nina Verma", relationship="close friend", tags=["friends", "planning"], city="Antwerp"),
    Contact(id="c_006", name="Tom Jacobs", relationship="friend", tags=["friends", "drinks"], city="Brussels"),
]

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


@router.get("/{contact_id}", response_model=Contact)
def get_contact(contact_id: str):
    for contact in contacts:
        if contact.id == contact_id:
            return contact

    raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
