"""Esquemas de mensajes de outreach."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field, field_validator


class MessageGenerate(BaseModel):
    channel: Literal["whatsapp"] = "whatsapp"
    message_type: Literal["first_contact", "follow_up", "demo_invite"] = "first_contact"


class MessageUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    edited_text: str = Field(
        min_length=1,
        max_length=2000,
        validation_alias=AliasChoices("edited_text", "text", "message"),
    )


class OutreachMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    lead_id: int
    contact_id: int | None
    campaign_id: int | None
    channel: str
    message_type: str
    generated_text: str
    edited_text: str | None
    status: str
    delivery_status: str | None
    provider_message_id: str | None
    delivery_error: str | None
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata_json", "metadata"),
    )
    created_at: datetime
    approved_at: datetime | None
    sent_at: datetime | None

    @field_validator("metadata", mode="before")
    @classmethod
    def _empty_metadata(cls, value: object) -> object:
        return value or {}

    @computed_field
    @property
    def text(self) -> str:
        return (self.edited_text or self.generated_text).strip()

    @computed_field
    @property
    def simulated(self) -> bool:
        return self.delivery_status == "simulated"

    @computed_field
    @property
    def sent_via(self) -> str | None:
        delivery = (self.metadata or {}).get("delivery")
        if isinstance(delivery, dict):
            provider = delivery.get("provider")
            return str(provider) if provider else None
        return None


class MessageDeliveryRead(BaseModel):
    status: str
    provider: str
    provider_message_id: str | None = None
    text: str


class MessageSendResponse(BaseModel):
    status: str
    text: str
    message: OutreachMessageRead
    delivery: MessageDeliveryRead
