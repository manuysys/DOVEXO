"""Runner del worker.

Uso:
    uv run python -m app.workers.runner
    uv run python -m app.workers.runner --once
    uv run python -m app.workers.runner --max-jobs 10 --poll-seconds 5
"""

from __future__ import annotations

import argparse
import time

from app.core.logging import configure_logging, get_logger
from app.database.session import SessionLocal
from app.workers.queue import run_once

logger = get_logger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ARVOKTA Sales Agent worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Procesa como máximo un trabajo y termina.",
    )
    parser.add_argument(
        "--max-jobs",
        type=int,
        default=0,
        help="Cantidad máxima de trabajos a procesar (0 = sin límite).",
    )
    parser.add_argument(
        "--poll-seconds",
        type=float,
        default=2.0,
        help="Espera entre consultas cuando no hay trabajos.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    configure_logging()
    logger.info("Worker iniciado")

    processed = 0
    try:
        while True:
            with SessionLocal() as db:
                job = run_once(db)

            if job is not None:
                processed += 1
                logger.info("Trabajo %s finalizado con estado %s", job.id, job.status)
            elif not args.once:
                time.sleep(max(0.1, args.poll_seconds))

            if args.once:
                break
            if args.max_jobs and processed >= args.max_jobs:
                break
    except KeyboardInterrupt:
        logger.info("Worker detenido por el usuario")

    logger.info("Worker finalizado; trabajos procesados: %s", processed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
