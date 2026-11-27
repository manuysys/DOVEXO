"""Modelos SQLAlchemy.

El import de todos los modelos es necesario para que Alembic y
`Base.metadata.create_all` vean el esquema completo.
"""

from app.models.campaign import Campaign, SearchRun
from app.models.company import Company, CompanySector, CompanySource
from app.models.crm import (
    Activity,
    CampaignLead,
    Contact,
    ImportBatch,
    Lead,
    LeadEvaluation,
    OutreachMessage,
    SuppressionEntry,
)
from app.models.job import Job
from app.models.product import Product, Sector
from app.models.user import User

__all__ = [
    "Activity",
    "Campaign",
    "CampaignLead",
    "Company",
    "CompanySector",
    "CompanySource",
    "Contact",
    "ImportBatch",
    "Job",
    "Lead",
    "LeadEvaluation",
    "OutreachMessage",
    "Product",
    "SearchRun",
    "Sector",
    "SuppressionEntry",
    "User",
]
