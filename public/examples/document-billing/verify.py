"""DocuON 공개 예제. 같은 디렉터리에서 python verify.py 로 실행합니다."""
from pathlib import Path
import json
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parent
QUERY = (ROOT / "billing.sql").read_text(encoding="utf-8")
RECORDS = json.loads((ROOT / "records.json").read_text(encoding="utf-8"))


class DocumentBillingTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            CREATE TABLE documents(id TEXT PRIMARY KEY, title TEXT NOT NULL);
            CREATE TABLE files(document_id TEXT NOT NULL, name TEXT NOT NULL, bytes INTEGER NOT NULL);
        """)
        for doc in RECORDS:
            self.db.execute("INSERT INTO documents VALUES (?, ?)", (doc["id"], doc["title"]))
            self.db.executemany(
                "INSERT INTO files VALUES (?, ?, ?)",
                [(doc["id"], f["name"], f["bytes"]) for f in doc["files"]],
            )

    def search(self, text, size=100, offset=0):
        return self.db.execute(QUERY, dict(query=text, page_size=size, offset=offset)).fetchall()

    def test_photo_finds_one_file_bills_both(self):
        row, = self.search("사진")
        self.assertEqual((row["id"], row["file_count"]), ("DOC-01", 2))
        self.assertEqual(row["matching_bytes"], 256 * 1024)
        self.assertEqual(row["stored_bytes"], 1310720)

    def test_two_file_hits_still_produce_one_document_row(self):
        rows = self.search("점검")
        self.assertEqual([r["id"] for r in rows], ["DOC-01", "DOC-02"])
        self.assertEqual(rows[1]["stored_bytes"], 640 * 1024)

    def test_document_page_keeps_all_its_files(self):
        first, = self.search("점검", size=1)
        second, = self.search("점검", size=1, offset=1)
        self.assertEqual((first["id"], first["file_count"], first["stored_bytes"]), ("DOC-01", 2, 1310720))
        self.assertEqual((second["id"], second["file_count"]), ("DOC-02", 2))

    def test_no_match(self):
        self.assertEqual(self.search("없는 파일"), [])

    def test_empty_query_includes_every_document(self):
        rows = self.search("")
        self.assertEqual(len(rows), len(RECORDS))
        expected = sum(f["bytes"] for d in RECORDS for f in d["files"])
        self.assertEqual(sum(r["stored_bytes"] for r in rows), expected)
        self.assertEqual(sum(r["matching_bytes"] for r in rows), expected)

    def test_empty_document_is_preserved_only_without_a_filter(self):
        self.db.execute("INSERT INTO documents VALUES ('DOC-04', '빈 문서')")
        row = self.search("")[-1]
        self.assertEqual((row["id"], row["file_count"], row["stored_bytes"]), ("DOC-04", 0, 0))
        self.assertTrue(all(r["id"] != "DOC-04" for r in self.search("pdf")))

    def test_document_title_alone_does_not_match_filename(self):
        self.assertEqual(self.search("보관소"), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
