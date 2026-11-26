-- 파일명은 일반 문자로 검색합니다. 페이지 크기는 문서 수입니다.
WITH page AS (
    SELECT d.id, d.title
    FROM documents AS d
    WHERE :query = '' OR EXISTS (
        SELECT 1 FROM files AS f
        WHERE f.document_id = d.id AND instr(f.name, :query) > 0
    )
    ORDER BY d.id
    LIMIT :page_size OFFSET :offset
)
SELECT p.id, p.title,
       COUNT(f.name) AS file_count,
       COALESCE(SUM(f.bytes), 0) AS stored_bytes,
       COALESCE(SUM(CASE WHEN instr(f.name, :query) > 0 THEN f.bytes ELSE 0 END), 0) AS matching_bytes
FROM page AS p
LEFT JOIN files AS f ON p.id = f.document_id
GROUP BY p.id, p.title
ORDER BY p.id;
