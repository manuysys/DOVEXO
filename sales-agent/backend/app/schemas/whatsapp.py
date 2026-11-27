"""Esquemas de WhatsApp."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field


class WhatsAppStatus(BaseModel):
    configured: bool
    mode: str
    sender_phone: str | None
    founder_phone_set: bool


class SimulateInbound(BaseModel):
    phone: str = Field(min_length=6, max_length=40)
    name: str | None = Field(default=None, max_length=200)
    text: str = Field(min_length=1, max_length=2000)


class WhatsAppMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_id: int
    direction: str
    wa_message_id: str | None
    body: str
    status: str
    raw_payload: dict[str, Any] | None
    sent_at: datetime | None
    created_at: datetime

    @computed_field
    @property
    def text(self) -> str:
        return self.body


class ThreadListItem(BaseModel):
    id: int
    phone: str
    name: str | None = None
    display_name: str | None
    company_id: int | None
    company_name: str | None
    contact_id: int | None
    lead_id: int | None
    lead_status: str | None
    status: str
    last_message_at: datetime | None
    last_message_text: str = ""
    unread: int = 0
    message_count: int
    created_at: datetime


class ThreadDetailRead(ThreadListItem):
    thread: ThreadListItem | None = None
    messages: list[WhatsAppMessageRead]


class SimulateInboundResponse(BaseModel):
    thread_id: int | None = None
    text: str | None = None
    thread: ThreadDetailRead
    reply: WhatsAppMessageRead | None = None
    duplicate: bool = False
    founder_notified: bool = False
