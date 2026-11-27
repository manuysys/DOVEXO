from __future__ import annotations

import os
import sqlite3
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _alembic(database_url: str, *args: str) -> None:
    env = {**os.environ, "DATABASE_URL": database_url}
    result = subprocess.run(  # noqa: S603 - comando fijo, sin entrada externa
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    assert result.returncode == 0, f"alembic {' '.join(args)} falló:\n{result.stderr}"


def _table_columns(connection: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}


def test_alembic_upgrade_from_scratch_and_downgrade(tmp_path: Path) -> None:
    database_path = tmp_path / "migration-test.db"
    database_url = f"sqlite:///{database_path.as_posix()}"

    _alembic(database_url, "upgrade", "head")

    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        assert {"companies", "company_sources", "search_runs", "jobs", "sectors"} <= tables
        assert {"search_config", "limit"} <= _table_columns(connection, "search_runs")
        assert "search_run_id" in _table_columns(connection, "company_sources")
        assert {
            "status",
            "valid_rows",
            "invalid_rows",
            "duplicate_rows",
            "preview_rows",
            "created_by",
            "confirmed_at",
        } <= _table_columns(connection, "import_batches")
        assert "next_follow_up_at" in _table_columns(connection, "leads")
        assert {
            "delivery_status",
            "provider_message_id",
            "delivery_error",
            "metadata",
        } <= _table_columns(connection, "outreach_messages")
        assert {"whatsapp_threads", "whatsapp_messages"} <= tables

    _alembic(database_url, "downgrade", "base")

    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        assert "companies" not in tables
        assert "search_runs" not in tables
        assert "alembic_version" in tables

    _alembic(database_url, "upgrade", "head")
    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        assert "companies" in tables
