from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_membership, require_roles
from app.core.config import settings
from app.core.db import get_db
from app.models import Membership
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIStatusResponse,
    AIUsageItem,
    AIUsageResponse,
)
from app.services import ai_service, security_service

router = APIRouter(prefix="/ai", tags=["ai"])

# El asistente consume cuota paga del proveedor: solo roles operativos.
CHAT_ROLES = ("owner", "admin", "dispatcher")


@router.get("/status", response_model=AIStatusResponse)
async def get_status(
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> AIStatusResponse:
    data = await ai_service.get_status(db, tenant_id=membership.tenant_id)
    return AIStatusResponse(**data)


@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    payload: AIChatRequest,
    request: Request,
    membership: Membership = Depends(require_roles(*CHAT_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> AIChatResponse:
    await security_service.check_rate_limit(
        db,
        request,
        scope="ai-chat",
        limit=settings.rate_limit_ai_chat_per_minute,
        identifier=f"{membership.tenant_id}:{membership.user_id}",
    )
    data = await ai_service.chat(
        db,
        membership=membership,
        message=payload.message,
    )
    return AIChatResponse(**data)


@router.get("/usage", response_model=AIUsageResponse)
async def get_usage(
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> AIUsageResponse:
    data = await ai_service.get_usage(db, tenant_id=membership.tenant_id)
    return AIUsageResponse(
        items=[AIUsageItem.model_validate(item) for item in data["items"]],
        total_tokens=data["total_tokens"],
        total_cost=data["total_cost"],
        monthly_limit=data["monthly_limit"],
        remaining=data["remaining"],
    )
