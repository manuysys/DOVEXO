"""Catálogo de referencia y vocabularios del dominio.

Los datos de provincias, rubros y semillas son configuración inicial, no
lógica de negocio: se cargan en base y pueden editarse desde la API.
"""

from __future__ import annotations

from typing import Any

LEAD_STATUSES: tuple[str, ...] = (
    "new",
    "researched",
    "pending_review",
    "approved",
    "contacted",
    "replied",
    "interested",
    "meeting_scheduled",
    "proposal_sent",
    "customer",
    "not_interested",
    "invalid",
    "do_not_contact",
)

# Estados que cuentan como "aprobado o más avanzado" en el pipeline.
LEAD_APPROVED_STATUSES: tuple[str, ...] = (
    "approved",
    "contacted",
    "replied",
    "interested",
    "meeting_scheduled",
    "proposal_sent",
    "customer",
)
LEAD_CONTACTED_STATUSES: tuple[str, ...] = (
    "contacted",
    "replied",
    "interested",
    "meeting_scheduled",
    "proposal_sent",
    "customer",
)
LEAD_RESPONSE_STATUSES: tuple[str, ...] = (
    "replied",
    "interested",
    "meeting_scheduled",
    "proposal_sent",
    "customer",
)
LEAD_MEETING_STATUSES: tuple[str, ...] = (
    "meeting_scheduled",
    "proposal_sent",
    "customer",
)

CAMPAIGN_STATUSES: tuple[str, ...] = ("draft", "active", "paused", "cancelled")

JOB_STATUSES: tuple[str, ...] = ("pending", "running", "completed", "failed", "cancelled")
JOB_TYPES: tuple[str, ...] = ("noop", "search_run", "enrich_company")

CONTACT_TYPES: tuple[str, ...] = ("phone", "whatsapp", "email", "website_form", "social", "other")
CONTACT_VERIFICATION_STATUSES: tuple[str, ...] = (
    "unverified",
    "pending",
    "published",
    "verified",
    "invalid",
)
PUBLISHED_CONTACT_STATUSES: tuple[str, ...] = ("published", "verified")

PROVINCES: tuple[dict[str, str], ...] = (
    {"code": "AR-C", "name": "Ciudad Autónoma de Buenos Aires"},
    {"code": "AR-B", "name": "Buenos Aires"},
    {"code": "AR-K", "name": "Catamarca"},
    {"code": "AR-H", "name": "Chaco"},
    {"code": "AR-U", "name": "Chubut"},
    {"code": "AR-X", "name": "Córdoba"},
    {"code": "AR-W", "name": "Corrientes"},
    {"code": "AR-E", "name": "Entre Ríos"},
    {"code": "AR-P", "name": "Formosa"},
    {"code": "AR-Y", "name": "Jujuy"},
    {"code": "AR-L", "name": "La Pampa"},
    {"code": "AR-F", "name": "La Rioja"},
    {"code": "AR-M", "name": "Mendoza"},
    {"code": "AR-N", "name": "Misiones"},
    {"code": "AR-Q", "name": "Neuquén"},
    {"code": "AR-R", "name": "Río Negro"},
    {"code": "AR-A", "name": "Salta"},
    {"code": "AR-J", "name": "San Juan"},
    {"code": "AR-D", "name": "San Luis"},
    {"code": "AR-Z", "name": "Santa Cruz"},
    {"code": "AR-S", "name": "Santa Fe"},
    {"code": "AR-G", "name": "Santiago del Estero"},
    {"code": "AR-V", "name": "Tierra del Fuego, Antártida e Islas del Atlántico Sur"},
    {"code": "AR-T", "name": "Tucumán"},
)

PROVINCE_CODES: frozenset[str] = frozenset(province["code"] for province in PROVINCES)
PROVINCE_NAME_BY_CODE: dict[str, str] = {
    province["code"]: province["name"] for province in PROVINCES
}

COMPANY_DISCOVERY_STATUSES: tuple[str, ...] = (
    "discovered",
    "imported",
    "manual",
    "possible_duplicate",
    "enriched",
    "rejected",
    "archived",
)

SECTORS: tuple[dict[str, Any], ...] = (
    {
        "slug": "hvac",
        "name": "Refrigeración y climatización",
        "synonyms": [
            "refrigeración",
            "climatización",
            "aire acondicionado",
            "calefacción",
            "refrigeración industrial",
            "instalación de aires",
        ],
        "keywords": [
            "instalación de aire acondicionado",
            "mantenimiento de refrigeración industrial",
            "service de calefacción",
            "cámara frigorífica",
            "split",
        ],
    },
    {
        "slug": "it_support",
        "name": "Soporte informático",
        "synonyms": [
            "soporte IT",
            "informática",
            "reparación de PC",
            "redes",
            "servidores",
            "asistencia técnica informática",
        ],
        "keywords": [
            "soporte IT para empresas",
            "reparación de computadoras",
            "instalación de redes",
            "administración de servidores",
            "help desk",
        ],
    },
    {
        "slug": "electronic_security",
        "name": "Seguridad electrónica",
        "synonyms": [
            "cámaras de seguridad",
            "CCTV",
            "alarmas",
            "cercos eléctricos",
            "control de acceso",
            "seguridad electrónica",
        ],
        "keywords": [
            "instalación de cámaras de seguridad",
            "monitoreo de alarmas",
            "control de acceso",
            "cerco eléctrico perimetral",
            "videovigilancia",
        ],
    },
    {
        "slug": "industrial_maintenance",
        "name": "Mantenimiento industrial y edilicio",
        "synonyms": [
            "mantenimiento industrial",
            "mantenimiento edilicio",
            "instalaciones técnicas",
            "servicios operativos",
        ],
        "keywords": [
            "mantenimiento preventivo industrial",
            "mantenimiento de edificios",
            "servicios generales",
            "instalaciones técnicas",
            "paradas de planta",
        ],
    },
    {
        "slug": "gates_automation",
        "name": "Automatización de portones y accesos",
        "synonyms": [
            "automatización de portones",
            "portones automáticos",
            "barreras",
            "puertas automáticas",
            "accesos automáticos",
        ],
        "keywords": [
            "reparación de portones automáticos",
            "instalación de portón corredizo",
            "automatización de barreras",
            "motor de portón",
            "control remoto de accesos",
        ],
    },
    {
        "slug": "appliance_repair",
        "name": "Reparación de electrodomésticos",
        "synonyms": [
            "service de electrodomésticos",
            "reparación de electrodomésticos",
            "reparación de lavarropas",
            "service técnico",
        ],
        "keywords": [
            "service de electrodomésticos a domicilio",
            "reparación de lavarropas",
            "reparación de heladeras",
            "reparación de lavavajillas",
            "asistencia técnica de línea blanca",
        ],
    },
    {
        "slug": "electrical_installations",
        "name": "Instalaciones eléctricas",
        "synonyms": [
            "instalaciones eléctricas",
            "mantenimiento eléctrico",
            "electricidad comercial",
            "electricidad industrial",
        ],
        "keywords": [
            "mantenimiento eléctrico industrial",
            "instalación eléctrica comercial",
            "tablero eléctrico",
            "puesta a tierra",
            "electricista matriculado",
        ],
    },
)

SECTOR_SLUGS: frozenset[str] = frozenset(sector["slug"] for sector in SECTORS)

DOVEXO_PRODUCT: dict[str, Any] = {
    "name": "DOVEXO",
    "slug": "dovexo",
    "description": (
        "Plataforma SaaS para empresas de servicios técnicos, instalaciones y operaciones de campo."
    ),
    "value_proposition": (
        "Centralizar la operación de empresas de servicios técnicos en una única "
        "plataforma para organizar clientes, solicitudes, presupuestos, órdenes de "
        "trabajo, agenda, técnicos y pagos."
    ),
    "target_profile": (
        "Empresas y profesionales que prestan servicios técnicos, instalaciones, "
        "reparaciones y mantenimiento."
    ),
    "pain_points": [
        "Falta de centralización de clientes",
        "Solicitudes desorganizadas",
        "Órdenes de trabajo dispersas",
        "Presupuestos manuales",
        "Dificultad para coordinar técnicos",
        "Agenda desorganizada",
        "Seguimiento insuficiente de trabajos",
        "Control de pagos y saldos",
        "Falta de historial de clientes",
        "Procesos administrativos repetitivos",
    ],
    "target_sectors": [sector["slug"] for sector in SECTORS],
    "keywords": sorted({keyword for sector in SECTORS for keyword in sector["keywords"]}),
    "scoring_config": {
        "version": 1,
        "factors": [
            {
                "key": "sector_affinity",
                "label": "Afinidad del rubro",
                "max_points": 30,
            },
            {
                "key": "field_services_evidence",
                "label": "Evidencia de trabajo de campo e instalaciones",
                "max_points": 20,
            },
            {
                "key": "repairs_maintenance",
                "label": "Reparaciones y mantenimiento",
                "max_points": 15,
            },
            {
                "key": "budget_and_scheduling",
                "label": "Gestión de presupuestos, visitas o servicios",
                "max_points": 15,
            },
            {
                "key": "recurring_clients",
                "label": "Señales de operaciones con clientes recurrentes",
                "max_points": 10,
            },
            {
                "key": "commercial_evidence_quality",
                "label": "Calidad de la evidencia comercial",
                "max_points": 10,
            },
        ],
        "notes": (
            "La compatibilidad no implica certeza. Las empresas pequeñas no se "
            "penalizan automáticamente."
        ),
    },
    "messaging_config": {
        "sender_name": "Juan Manuel",
        "sender_company": "ARVOKTA",
        "default_channel": "whatsapp",
        "tone": "profesional, natural y directo",
        "avoid_phrases": ["revolucionamos tu negocio"],
        "max_length_chars": 700,
        "requires_human_approval": True,
    },
}

INITIAL_CAMPAIGN: dict[str, Any] = {
    "name": "DOVEXO — Argentina — Prospección inicial",
    "description": (
        "Prospección inicial de DOVEXO en todo el país, sobre los siete rubros configurados."
    ),
    "country": "Argentina",
    "province_filters": [province["code"] for province in PROVINCES],
    "locality_filters": [],
    "sector_filters": [sector["slug"] for sector in SECTORS],
    "search_config": {
        "provider": "manual",
        "include_all_company_sizes": True,
        "notes": "Fase 1: sin proveedores de descubrimiento activos.",
    },
    "status": "active",
}
