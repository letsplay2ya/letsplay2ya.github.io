// Node.js 24: node verify-rows.mjs
// 가상 신청과 첨부만 사용하는 메모리 DB. 집계 기준이 조회 결과에 미치는 영향을 비교한다.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

try {
  db.exec(`
    CREATE TABLE document (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL
    );
    CREATE TABLE attachment (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES document(id),
      byte_count INTEGER NOT NULL CHECK (byte_count >= 0)
    );
    CREATE TABLE request_link (
      request_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      attachment_id TEXT NOT NULL REFERENCES attachment(id),
      PRIMARY KEY (request_id, sequence)
    );
    CREATE VIEW attachment_row AS
    SELECT l.request_id, l.sequence, d.id AS document_id, d.title, a.byte_count
    FROM request_link AS l
    JOIN attachment AS a ON a.id = l.attachment_id
    JOIN document AS d ON d.id = a.document_id;
  `);

  const insertDocument = db.prepare('INSERT INTO document VALUES (?, ?)');
  const insertAttachment = db.prepare('INSERT INTO attachment VALUES (?, ?, ?)');
  const insertLink = db.prepare('INSERT INTO request_link VALUES (?, ?, ?)');
  const title = '11월 장비 점검 기록';
  insertDocument.run('doc-a', title);
  insertDocument.run('doc-b', title);
  insertAttachment.run('body', 'doc-a', 1_048_576);
  insertAttachment.run('appendix', 'doc-a', 262_144);
  insertAttachment.run('photo', 'doc-b', 524_288);

  // 입력은 역순으로 넣어도 결과의 순서는 신청 내부 순번으로 정해진다.
  insertLink.run('review-a', 2, 'appendix');
  insertLink.run('review-a', 1, 'body');
  insertLink.run('review-b', 1, 'appendix');
  insertLink.run('review-b', 2, 'photo');

  const byLink = db.prepare(`
    SELECT document_id, title, sequence, COUNT(*) AS files, SUM(byte_count) AS bytes
    FROM attachment_row WHERE request_id = ?
    GROUP BY request_id, document_id, title, sequence
    ORDER BY sequence
  `);
  const byDocument = db.prepare(`
    SELECT document_id, title, COUNT(*) AS files, SUM(byte_count) AS bytes
    FROM attachment_row WHERE request_id = ?
    GROUP BY request_id, document_id, title
    ORDER BY MIN(sequence)
  `);
  byLink.setReturnArrays(true);
  byDocument.setReturnArrays(true);

  const linkRows = byLink.all('review-a');
  const documentRows = byDocument.all('review-a');
  assert.deepEqual(linkRows, [
    ['doc-a', title, 1, 1, 1_048_576],
    ['doc-a', title, 2, 1, 262_144],
  ]);
  assert.deepEqual(documentRows, [['doc-a', title, 2, 1_310_720]]);
  const totalBytes = documentRows[0][3];
  const totalMiB = totalBytes / (1024 * 1024);
  assert.equal(totalBytes, linkRows.reduce((sum, row) => sum + row[4], 0));
  assert.equal(totalMiB, 1.25);

  // 같은 제목의 다른 문서는 별개 행이다. 같은 첨부가 다른 신청에도 속할 수 있다.
  assert.deepEqual(byDocument.all('review-b'), [
    ['doc-a', title, 1, 262_144],
    ['doc-b', title, 1, 524_288],
  ]);
  assert.deepEqual(byLink.all('absent'), []);
  assert.deepEqual(byDocument.all('absent'), []);

  console.log('신청 A · 연결별 2행: 1048576 B, 262144 B');
  console.log(`신청 A · 문서별 1행: ${totalBytes} B = ${totalMiB} MiB (첨부 2개)`);
  console.log('신청 B · 같은 제목의 문서 2건: doc-a 262144 B, doc-b 524288 B');
  console.log('첨부 순번, 합계, 단위, 문서 식별자, 신청 범위, 빈 결과 검증 통과');
} finally {
  db.close();
}
