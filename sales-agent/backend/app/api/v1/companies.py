"""Empresas, fuentes y contactos."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import Company, Contact, Sector, User
from app.repositories.companies import (
    get_company,
    get_company_contacts,
    get_company_sectors,
    get_company_sources,
    list_companies,
    load_company_relations,
)
from app.schemas.company import (
    CompanyCreate,
    CompanyDetailRead,
    CompanyListItem,
    CompanyListResponse,
    CompanySourceRead,
    CompanyUpdate,
    ContactCreate,
    ContactRead,
    SectorRef,
)
from app.services.companies import (
    CompanyValidationError,
    ContactConflictError,
    DuplicateCompanyError,
    add_contact,
    canonical_province,
    create_manual_company,
    update_company,
)

router = APIRouter(prefix="/companies", tags=["companies"])


def _contact_reads(contacts: list[Contact]) -> list[ContactRead]:
    return [ContactRead.model_validate(contact) for contact in contacts]


def _first_value(contacts: list[Contact], contact_type: str) -> str | None:
    for contact in contacts:
        if contact.contact_type == contact_type and not contact.do_not_contact:
            return contact.normalized_value
    return None


def _item(
    company: Company,
    *,
    contacts: list[Contact],
    sectors: list[Sector],
    source_count: int,
) -> CompanyListItem:
    return CompanyListItem(
        id=company.id,
        name=company.name,
        description=company.description,
        website=company.website,
        province=company.province,
        locality=company.locality,
        address=company.address,
        discovery_status=company.discovery_status,
        sectors=[SectorRef.model_validate(sector) for sector in sectors],
        contacts=_contact_reads(contacts),
        primary_phone=_first_value(contacts, "phone"),
        primary_email=_first_value(contacts, "email"),
        whatsapp=_first_value(contacts, "whatsapp"),
        source_count=source_count,
        created_at=company.created_at,
    )


def _detail(db: Session, company: Company) -> CompanyDetailRead:
    contacts = get_company_contacts(db, company.id)
    sectors = get_company_sectors(db, company.id)
    sources = get_company_sources(db, company.id)
    base = _item(
        company,
        contacts=contacts,
        sectors=sectors,
        source_count=len(sources),
    )
    return CompanyDetailRead(
        **base.model_dump(),
        legal_name=company.legal_name,
        normalized_domain=company.normalized_domain,
        country=company.country,
        company_size_estimate=company.company_size_estimate,
        last_enriched_at=company.last_enriched_at,
        updated_at=company.updated_at,
        sources=[CompanySourceRead.model_validate(source) for source in sources],
    )


def _get_company_or_404(db: Session, company_id: int) -> Company:
    company = get_company(db, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada.",
        )
    return company


@router.get("", response_model=CompanyListResponse)
def list_companies_endpoint(
    search_run_id: int | None = Query(default=None, ge=1),
    query: str | None = Query(default=None, max_length=200),
    province: str | None = Query(default=None, max_length=120),
    sector: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyListResponse:
    canonical = None
    if province:
        try:
            canonical = canonical_province(province)
        except CompanyValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    companies, total = list_companies(
        db,
        search_run_id=search_run_id,
        query=query,
        province=canonical,
        sector=sector,
        limit=limit,
        offset=offset,
    )
    contacts_map, sectors_map, source_counts = load_company_relations(
        db, [company.id for company in companies]
    )
    items = [
        _item(
            company,
            contacts=contacts_map.get(company.id, []),
            sectors=sectors_map.get(company.id, []),
            source_count=source_counts.get(company.id, 0),
        )
        for company in companies
    ]
    return CompanyListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{company_id}", response_model=CompanyDetailRead)
def get_company_endpoint(
    company_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyDetailRead:
    return _detail(db, _get_company_or_404(db, company_id))


@router.post("", response_model=CompanyDetailRead, status_code=status.HTTP_201_CREATED)
def create_company_endpoint(
    payload: CompanyCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CompanyDetailRead | JSONResponse:
    try:
        company, _duplicate = create_manual_company(
            db,
            name=payload.name,
            website=payload.website,
            province=payload.province,
            locality=payload.locality,
            address=payload.address,
            sector_slugs=payload.sector_slugs,
            phone=payload.phone,
            email=payload.email,
        )
    except DuplicateCompanyError as exc:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "Ya existe una empresa con esos datos.",
                "duplicate_of": exc.match.company_id,
                "reason": exc.match.reason,
                "company_name": exc.match.company_name,
            },
        )
    except (CompanyValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return _detail(db, company)


@router.patch("/{company_id}", response_model=CompanyDetailRead)
def update_company_endpoint(
    company_id: int,
    payload: CompanyUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CompanyDetailRead:
    company = _get_company_or_404(db, company_id)
    changes = payload.model_dump(exclude_unset=True)
    if "sector_slugs" in changes and changes["sector_slugs"] is None:
        changes.pop("sector_slugs")
    try:
        company = update_company(db, company, changes)
    except (CompanyValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return _detail(db, company)


@router.get("/{company_id}/contacts", response_model=list[ContactRead])
def list_contacts_endpoint(
    company_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ContactRead]:
    _get_company_or_404(db, company_id)
    return _contact_reads(get_company_contacts(db, company_id))


@router.post(
    "/{company_id}/contacts",
    response_model=ContactRead,
    status_code=status.HTTP_201_CREATED,
)
def create_contact_endpoint(
    company_id: int,
    payload: ContactCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ContactRead:
    company = _get_company_or_404(db, company_id)
    try:
        contact = add_contact(
            db,
            company,
            contact_type=payload.contact_type,
            value=payload.value,
            label=payload.label,
            is_primary=payload.is_primary,
            verification_status=payload.verification_status,
        )
    except ContactConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (CompanyValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return ContactRead.model_validate(contact)
