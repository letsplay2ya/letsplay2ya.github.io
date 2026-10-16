import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier
from pipeline import apply_record, connect, initialize

ROW = {"record_id": "A-001", "occurred_on": "2026-10-16", "amount": "25.50", "company": "예시기업"}


class ImportTest(unittest.TestCase):
    def setUp(self):
        self.connection = connect(":memory:")
        initialize(self.connection)

    def tearDown(self):
        self.connection.close()

    def test_create_then_replay_normalized_content(self):
        self.assertEqual(apply_record(self.connection, ROW)["status"], "created")
        self.assertEqual(apply_record(self.connection, {**ROW, "amount": "025.5", "company": " 예시기업 "})["status"], "replayed")
        self.assertEqual(self.connection.execute("SELECT count(*) FROM records").fetchone()[0], 1)

    def test_conflict_preserves_first_content(self):
        apply_record(self.connection, ROW)
        for change in [{"amount": "26"}, {"company": "다른기업"}, {"occurred_on": "2026-10-17"}]:
            self.assertEqual(apply_record(self.connection, {**ROW, **change})["status"], "conflict")
        self.assertEqual(self.connection.execute("SELECT amount_minor FROM records").fetchone()[0], 2550)

    def test_new_key_is_new_record(self):
        apply_record(self.connection, ROW)
        self.assertEqual(apply_record(self.connection, {**ROW, "record_id": "A-002"})["status"], "created")

    def test_invalid_input_writes_nothing(self):
        for change in [{"amount": "NaN"}, {"amount": "-1"}, {"amount": "1.001"}, {"occurred_on": "2026-02-30"}, {"company": " "}, {"company": None}, {"amount": 25.5}]:
            with self.assertRaises(ValueError):
                apply_record(self.connection, {**ROW, **change})
        self.assertEqual(self.connection.execute("SELECT count(*) FROM records").fetchone()[0], 0)

    def test_insert_failure_rolls_back_and_releases_transaction(self):
        self.connection.execute("CREATE TRIGGER reject_insert BEFORE INSERT ON records BEGIN SELECT RAISE(ABORT, 'injected failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            apply_record(self.connection, ROW)
        self.assertFalse(self.connection.in_transaction)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM records").fetchone()[0], 0)

    def test_caller_transaction_is_rejected(self):
        self.connection.execute("BEGIN")
        with self.assertRaisesRegex(ValueError, "CALLER_TRANSACTION"):
            apply_record(self.connection, ROW)
        self.assertTrue(self.connection.in_transaction)
        self.connection.rollback()

    def parallel(self, second_amount):
        with tempfile.TemporaryDirectory() as temporary:
            database = Path(temporary) / "example.sqlite3"
            setup = connect(database)
            initialize(setup)
            setup.close()
            barrier = Barrier(2)
            def write(amount):
                connection = connect(database)
                try:
                    barrier.wait(timeout=3)
                    return apply_record(connection, {**ROW, "amount": amount})["status"]
                finally:
                    connection.close()
            with ThreadPoolExecutor(max_workers=2) as workers:
                first = workers.submit(write, "25.50")
                second = workers.submit(write, second_amount)
                statuses = [first.result(timeout=10), second.result(timeout=10)]
            check = connect(database)
            try:
                rows = check.execute("SELECT amount_minor FROM records").fetchall()
            finally:
                check.close()
            return statuses, rows

    def test_two_connections_same_content(self):
        statuses, rows = self.parallel("25.5")
        self.assertCountEqual(statuses, ["created", "replayed"])
        self.assertEqual(rows, [(2550,)])

    def test_two_connections_conflicting_content(self):
        statuses, rows = self.parallel("26")
        self.assertCountEqual(statuses, ["created", "conflict"])
        self.assertEqual(len(rows), 1)
        self.assertIn(rows[0][0], [2550, 2600])


if __name__ == "__main__":
    unittest.main()
