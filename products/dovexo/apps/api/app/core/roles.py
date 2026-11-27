"""Roles de membresía de un tenant.

Los cupos del plan se separan en dos grupos excluyentes: usuarios de oficina
(`max_users`, incluye al dueño) y técnicos (`max_technicians`). Un técnico no
consume cupo de oficina y viceversa.
"""

from typing import Final

TECHNICIAN_ROLE: Final[str] = "technician"

OFFICE_ROLES: Final[frozenset[str]] = frozenset({"owner", "admin", "dispatcher", "viewer"})

__all__ = ["OFFICE_ROLES", "TECHNICIAN_ROLE"]
