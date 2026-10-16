"""Single-record idempotent write experiment; Python 3.11+ standard library only."""
import re
import sqlite3
from datetime import date
from decimal import Decimal


def normalize(row):
    if any(not isinstance(row.get(field), str) for field in ("record_id", "occurred_on", "amount", "company")):
        raise ValueError("FIELD_TYPE")
    record_id = str(row["record_id"]).strip()
    day = str(row["occurred_on"]).strip()
    amount = str(row["amount"]).strip()
    company = str(row["company"]).strip()
    if not re.fullmatch(r"A-[0-9]{3}", record_id):
        raise ValueError("ID_FORMAT")
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", day):
        raise ValueError("DATE_FORMAT")
    date.fromisoformat(day)
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]{1,2})?", amount):
        raise ValueError("AMOUNT_FORMAT")
    decimal_amount = Decimal(amount)
    if decimal_amount > Decimal("999999999999.99"):
        raise ValueError("AMOUNT_RANGE")
    if not company:
        raise ValueError("COMPANY_REQUIRED")
    return record_id, day, int(decimal_amount * 100), company


def initialize(connection):
    connection.execute("CREATE TABLE IF NOT EXISTS records(record_id TEXT PRIMARY KEY, occurred_on TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor >= 0), company TEXT NOT NULL)")


def apply_record(connection, row):
    """Owns one short transaction. Caller must not already have a transaction."""
    if connection.in_transaction:
        raise ValueError("CALLER_TRANSACTION_NOT_SUPPORTED")
    normalized = normalize(row)
    connection.execute("BEGIN IMMEDIATE")
    try:
        existing = connection.execute(
            "SELECT record_id, occurred_on, amount_minor, company FROM records WHERE record_id = ?",
            (normalized[0],),
        ).fetchone()
        if existing is None:
            connection.execute("INSERT INTO records VALUES (?, ?, ?, ?)", normalized)
            status = "created"
        elif tuple(existing) == normalized:
            status = "replayed"
        else:
            status = "conflict"
        connection.commit()
        return {"record_id": normalized[0], "status": status}
    except BaseException:
        connection.rollback()
        raise


def connect(path):
    return sqlite3.connect(path, timeout=3, isolation_level=None)
