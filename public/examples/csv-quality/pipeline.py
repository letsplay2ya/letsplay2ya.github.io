"""Python 3.11+ / standard library only. No Oracle connection is made."""
import argparse
import csv
import io
import json
import re
import sqlite3
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

HEADERS = ["record_id", "occurred_on", "amount", "company"]

def classify(row, known):
    errors = []
    record_id = row["record_id"].strip()
    if not re.fullmatch(r"A-[0-9]{3}", record_id):
        errors.append("ID_FORMAT")
    elif record_id in known:
        errors.append("DUPLICATE_ID")
    day = row["occurred_on"].strip()
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", day):
        errors.append("DATE_FORMAT")
    else:
        try:
            date.fromisoformat(day)
        except ValueError:
            errors.append("DATE_VALUE")
    text = row["amount"].strip()
    amount = None
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]{1,2})?", text):
        errors.append("AMOUNT_FORMAT")
    else:
        try:
            amount = Decimal(text)
            if amount > Decimal("999999999999.99"):
                errors.append("AMOUNT_RANGE")
        except InvalidOperation:
            errors.append("AMOUNT_FORMAT")
    if not row["company"].strip():
        errors.append("COMPANY_REQUIRED")
    if errors:
        return None, errors
    known.add(record_id)
    # Store money as integer minor units; no binary floating point conversion.
    return (record_id, day, int(amount * 100), row["company"].strip()), []

def ingest(text, connection):
    reader = csv.DictReader(io.StringIO(text), strict=True)
    if reader.fieldnames != HEADERS:
        raise ValueError("Expected exactly: " + ",".join(HEADERS))
    rows = list(reader)  # Parse first: malformed CSV must not partially save.
    if any(None in row or any(v is None for v in row.values()) for row in rows):
        raise ValueError("A CSV record has a different number of columns.")
    accepted, rejected = [], []
    with connection:
        connection.execute("CREATE TABLE IF NOT EXISTS records (record_id TEXT PRIMARY KEY, occurred_on TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor >= 0), company TEXT NOT NULL)")
        connection.execute("CREATE TABLE IF NOT EXISTS staging (batch_no INTEGER, record_no INTEGER, raw_json TEXT, errors TEXT)")
        batch = connection.execute("SELECT COALESCE(MAX(batch_no), 0) + 1 FROM staging").fetchone()[0]
        known = {row[0] for row in connection.execute("SELECT record_id FROM records")}
        for index, row in enumerate(rows, 1):
            clean, errors = classify(row, known)
            connection.execute("INSERT INTO staging VALUES (?, ?, ?, ?)", (batch, index, json.dumps(row, ensure_ascii=False), json.dumps(errors)))
            if errors:
                rejected.append({"record_no": index, **row, "errors": "|".join(errors)})
            else:
                connection.execute("INSERT INTO records VALUES (?, ?, ?, ?)", clean)
                accepted.append(dict(zip(["record_id", "occurred_on", "amount_minor", "company"], clean)))
    assert len(rows) == len(accepted) + len(rejected)
    return {"input": len(rows), "accepted": len(accepted), "rejected": len(rejected)}, accepted, rejected

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", type=Path, default=Path(".qa/csv-quality"))
    args = parser.parse_args()
    text = args.input.read_text(encoding="utf-8-sig")
    args.out.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(args.out / "quality.sqlite3") as connection:
        summary, accepted, rejected = ingest(text, connection)
    for name, rows, headers in [
        ("accepted.csv", accepted, ["record_id", "occurred_on", "amount_minor", "company"]),
        ("rejected.csv", rejected, ["record_no", *HEADERS, "errors"]),
    ]:
        with (args.out / name).open("w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary))

if __name__ == "__main__":
    main()
