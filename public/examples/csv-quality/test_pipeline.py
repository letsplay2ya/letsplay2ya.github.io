import csv
import importlib.util
import sqlite3
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("pipeline", HERE / "pipeline.py")
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)

class PipelineTests(unittest.TestCase):
    def test_sample_and_retry(self):
        with sqlite3.connect(":memory:") as db:
            text = (HERE / "input.csv").read_text(encoding="utf-8")
            summary, accepted, rejected = pipeline.ingest(text, db)
            self.assertEqual(summary, {"input": 9, "accepted": 3, "rejected": 6})
            self.assertEqual([r["record_id"] for r in accepted], ["A-001", "A-006", "A-007"])
            self.assertEqual(accepted[-1]["amount_minor"], 2550)
            self.assertEqual(accepted[-1]["company"], "예시, 서비스")
            self.assertEqual(db.execute("SELECT COUNT(*) FROM staging").fetchone()[0], 9)
            self.assertEqual([r["errors"] for r in rejected], ["DATE_VALUE", "AMOUNT_FORMAT", "DUPLICATE_ID", "AMOUNT_FORMAT", "AMOUNT_FORMAT", "DATE_FORMAT"])
            retry, _, _ = pipeline.ingest(text, db)
            self.assertEqual(retry["accepted"], 0)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM records").fetchone()[0], 3)

    def test_bad_csv_is_not_partially_saved(self):
        with sqlite3.connect(":memory:") as db:
            with self.assertRaises((ValueError, csv.Error)):
                pipeline.ingest('record_id,occurred_on,amount,company\nA-001,2026-01-01,1,ok\nA-002,2026-01-01,2', db)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sqlite_master WHERE name='records'").fetchone()[0], 0)

    def test_sql_failure_rolls_back(self):
        with sqlite3.connect(":memory:") as db:
            db.execute("CREATE TABLE records(record_id TEXT PRIMARY KEY, occurred_on TEXT, amount_minor INTEGER CHECK(amount_minor < 200), company TEXT)")
            text = 'record_id,occurred_on,amount,company\nA-001,2026-01-01,1,first\nA-002,2026-01-02,3,second\n'
            with self.assertRaises(sqlite3.IntegrityError):
                pipeline.ingest(text, db)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM records").fetchone()[0], 0)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM staging").fetchone()[0], 0)

if __name__ == "__main__":
    unittest.main()
