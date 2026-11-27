"""Router agregado de /api/v1."""

from fastapi import APIRouter

from app.api.v1 import (
    activities,
    auth,
    campaigns,
    companies,
    dashboard,
    health,
    imports,
    jobs,
    leads,
    messages,
    meta,
    products,
    search_runs,
    suppressions,
    webhooks,
    whatsapp,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(meta.router)
api_router.include_router(products.router)
api_router.include_router(campaigns.router)
api_router.include_router(search_runs.router)
api_router.include_router(companies.router)
api_router.include_router(imports.router)
api_router.include_router(leads.router)
api_router.include_router(messages.router)
api_router.include_router(activities.router)
api_router.include_router(suppressions.router)
api_router.include_router(whatsapp.router)
api_router.include_router(whatsapp.threads_router)
api_router.include_router(webhooks.router)
api_router.include_router(dashboard.router)
api_router.include_router(jobs.router)
