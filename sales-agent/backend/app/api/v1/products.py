"""CRUD de productos."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import Product, Sector, User
from app.repositories.products import (
    create_product,
    get_product,
    get_product_by_slug,
    list_products,
    update_product,
)
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _validate_target_sectors(db: Session, slugs: list[str]) -> None:
    if not slugs:
        return
    known = set(db.scalars(select(Sector.slug)))
    unknown = sorted(set(slugs) - known)
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Rubros desconocidos: {', '.join(unknown)}",
        )


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
    return product


@router.get("", response_model=list[ProductRead])
def list_products_endpoint(
    include_inactive: bool = Query(default=False),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    return [
        ProductRead.model_validate(product)
        for product in list_products(db, include_inactive=include_inactive)
    ]


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product_endpoint(
    payload: ProductCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ProductRead:
    if payload.slug is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El slug es obligatorio.",
        )
    if get_product_by_slug(db, payload.slug) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un producto con ese slug.",
        )
    _validate_target_sectors(db, payload.target_sectors)
    product = create_product(db, payload.model_dump())
    return ProductRead.model_validate(product)


@router.get("/{product_id}", response_model=ProductRead)
def get_product_endpoint(
    product_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductRead.model_validate(_get_product_or_404(db, product_id))


@router.patch("/{product_id}", response_model=ProductRead)
def update_product_endpoint(
    product_id: int,
    payload: ProductUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ProductRead:
    product = _get_product_or_404(db, product_id)
    changes = payload.model_dump(exclude_unset=True)

    new_slug = changes.get("slug")
    if new_slug and new_slug != product.slug:
        existing = get_product_by_slug(db, new_slug)
        if existing is not None and existing.id != product.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un producto con ese slug.",
            )

    if "target_sectors" in changes:
        _validate_target_sectors(db, changes["target_sectors"])

    product = update_product(db, product, changes)
    return ProductRead.model_validate(product)


@router.delete("/{product_id}", response_model=ProductRead)
def deactivate_product_endpoint(
    product_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ProductRead:
    """Desactiva el producto; no borra datos históricos."""
    product = _get_product_or_404(db, product_id)
    if product.is_active:
        product = update_product(db, product, {"is_active": False})
    return ProductRead.model_validate(product)
