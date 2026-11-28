"""Empresas, fuentes y contactos."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.constants import COMPANY_DISCOVERY_STATUSES
from app.database.session import get_db
from app.models import Company, CompanySource, Contact, Job, Sector, User
from app.repositories.companies import (
    get_company,
    get_company_contacts,
    get_company_sectors,
    get_company_sources,
    list_companies,
    load_company_relations,
    load_company_sources,
)
from app.repositories.enrichment import (
    get_company_facts,
    get_enrichment_job,
    list_enrichment_jobs,
    load_contact_sources,
    load_job_company_names,
)
from app.schemas.company import (
    CompanyCreate,
    CompanyDetailRead,
    CompanyFactRead,
    CompanyListItem,
    CompanyListResponse,
    CompanySourceRead,
    CompanyUpdate,
    ContactCreate,
    ContactRead,
    SectorRef,
)
from app.schemas.enrichment import (
    EnrichmentBatchRequest,
    EnrichmentBatchResponse,
    EnrichmentJobRead,
    EnrichmentResultRead,
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
from app.services.companies_export import build_rows, render_csv
from app.services.enrichment import (
    EnrichmentValidationError,
    enqueue_enrichment_batch,
    enrich_company,
    get_website_fetcher,
)

router = APIRouter(prefix="/companies", tags=["companies"])


def _contact_read(
    contact: Contact,
    source: CompanySource | None,
) -> ContactRead:
    return ContactRead(
        id=contact.id,
        contact_type=contact.contact_type,
        value=contact.original_value,
        normalized_value=contact.normalized_value,
        label=contact.label,
        is_primary=contact.is_primary,
        verification_status=contact.verification_status,
        do_not_contact=contact.do_not_contact,
        verified_at=contact.verified_at,
        source_url=source.source_url if source is not None else None,
        source_title=source.title if source is not None else None,
        source_collected_at=source.collected_at if source is not None else None,
        source_confidence=source.confidence if source is not None else None,
    )


def _contact_reads(
    contacts: list[Contact],
    sources: dict[int, CompanySource] | None = None,
) -> list[ContactRead]:
    resolved = sources or {}
    return [_contact_read(contact, resolved.get(contact.source_id or 0)) for contact in contacts]


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
    contact_sources: dict[int, CompanySource] | None = None,
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
        contacts=_contact_reads(contacts, contact_sources),
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
        contact_sources=load_contact_sources(db, contacts),
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
        facts=[CompanyFactRead.model_validate(fact) for fact in get_company_facts(db, company.id)],
    )


def _get_company_or_404(db: Session, company_id: int) -> Company:
    company = get_company(db, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada.",
        )
    return company


def _job_company_id(job: Job) -> int | None:
    try:
        value = int((job.payload or {}).get("company_id", 0))
    except (TypeError, ValueError):
        return None
    return value or None


@router.get("", response_model=CompanyListResponse)
def list_companies_endpoint(
    search_run_id: int | None = Query(default=None, ge=1),
    query: str | None = Query(default=None, max_length=200),
    province: str | None = Query(default=None, max_length=120),
    sector: str | None = Query(default=None, max_length=80),
    discovery_status: str | None = Query(default=None, max_length=40),
    has_website: bool | None = Query(default=None),
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
    if discovery_status and discovery_status not in COMPANY_DISCOVERY_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado de descubrimiento inválido: {discovery_status}",
        )

    companies, total = list_companies(
        db,
        search_run_id=search_run_id,
        query=query,
        province=canonical,
        sector=sector,
        discovery_status=discovery_status,
        has_website=has_website,
        limit=limit,
        offset=offset,
    )
    contacts_map, sectors_map, source_counts = load_company_relations(
        db, [company.id for company in companies]
    )
    all_contacts = [contact for contacts in contacts_map.values() for contact in contacts]
    contact_sources = load_contact_sources(db, all_contacts)
    items = [
        _item(
            company,
            contacts=contacts_map.get(company.id, []),
            sectors=sectors_map.get(company.id, []),
            source_count=source_counts.get(company.id, 0),
            contact_sources=contact_sources,
        )
        for company in companies
    ]
    return CompanyListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/export.csv")
def export_companies_endpoint(
    search_run_id: int | None = Query(default=None, ge=1),
    query: str | None = Query(default=None, max_length=200),
    province: str | None = Query(default=None, max_length=120),
    sector: str | None = Query(default=None, max_length=80),
    discovery_status: str | None = Query(default=None, max_length=40),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    canonical = None
    if province:
        try:
            canonical = canonical_province(province)
        except CompanyValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if discovery_status and discovery_status not in COMPANY_DISCOVERY_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado de descubrimiento inválido: {discovery_status}",
        )

    companies, _total = list_companies(
        db,
        search_run_id=search_run_id,
        query=query,
        province=canonical,
        sector=sector,
        discovery_status=discovery_status,
        limit=None,
        offset=0,
    )
    contacts_map, sectors_map, _source_counts = load_company_relations(
        db, [company.id for company in companies]
    )
    sources_map = load_company_sources(db, [company.id for company in companies])
    content = render_csv(
        build_rows(
            companies,
            contacts=contacts_map,
            sectors=sectors_map,
            sources=sources_map,
        )
    )
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="empresas.csv"'},
    )


@router.post("/enrich", response_model=EnrichmentBatchResponse)
def enqueue_enrichment_endpoint(
    payload: EnrichmentBatchRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EnrichmentBatchResponse:
    canonical = None
    if payload.province:
        try:
            canonical = canonical_province(payload.province)
        except CompanyValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    try:
        summary = enqueue_enrichment_batch(
            db,
            company_ids=payload.company_ids,
            limit=payload.limit,
            search_run_id=payload.search_run_id,
            province=canonical,
            sector=payload.sector,
            query=payload.query,
        )
    except EnrichmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return EnrichmentBatchResponse(**summary)


@router.get("/enrich/jobs", response_model=list[EnrichmentJobRead])
def list_enrichment_jobs_endpoint(
    limit: int = Query(default=50, ge=1, le=200),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[EnrichmentJobRead]:
    jobs = list_enrichment_jobs(db, limit=limit)
    names = load_job_company_names(db, jobs)
    reads: list[EnrichmentJobRead] = []
    for job in jobs:
        company_id = _job_company_id(job)
        reads.append(
            EnrichmentJobRead(
                id=job.id,
                company_id=company_id,
                company_name=names.get(company_id) if company_id is not None else None,
                status=job.status,
                attempts=job.attempts,
                max_attempts=job.max_attempts,
                error_message=job.error_message,
                result=job.result,
                created_at=job.created_at,
                started_at=job.started_at,
                finished_at=job.finished_at,
            )
        )
    return reads


@router.get("/enrich/jobs/{job_id}", response_model=EnrichmentJobRead)
def get_enrichment_job_endpoint(
    job_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EnrichmentJobRead:
    job = get_enrichment_job(db, job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajo de enriquecimiento no encontrado.",
        )
    company_id = _job_company_id(job)
    names = load_job_company_names(db, [job])
    return EnrichmentJobRead(
        id=job.id,
        company_id=company_id,
        company_name=names.get(company_id) if company_id is not None else None,
        status=job.status,
        attempts=job.attempts,
        max_attempts=job.max_attempts,
        error_message=job.error_message,
        result=job.result,
        created_at=job.created_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
    )


@router.post("/{company_id}/enrich", response_model=EnrichmentResultRead)
def enrich_company_endpoint(
    company_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EnrichmentResultRead:
    company = _get_company_or_404(db, company_id)
    result = enrich_company(db, company, fetcher=get_website_fetcher())
    if result.status == "no_website":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La empresa no tiene un sitio web cargado para investigar.",
        )
    if result.status == "unsafe":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El sitio web no se puede visitar: {result.error}",
        )
    if result.status == "fetch_error":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"No se pudo leer el sitio web: {result.error}",
        )
    return EnrichmentResultRead(**result.to_dict())


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
    contacts = get_company_contacts(db, company_id)
    return _contact_reads(contacts, load_contact_sources(db, contacts))


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
    return _contact_read(contact, None)
