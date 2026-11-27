"""Router agregado de /api/v1."""

from fastapi import APIRouter

from app.api.v1 import auth, campaigns, dashboard, health, jobs, meta, products

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(meta.router)
api_router.include_router(products.router)
api_router.include_router(campaigns.router)
api_router.include_router(dashboard.router)
api_router.include_router(jobs.router)
