# Retry versus content conflict

Python 3.11+ standard library, SQLite; separate experiment from csv-quality.
Download pipeline.py and test_pipeline.py together, then:

```sh
python -B -m unittest discover -s . -p "test_*.py"
```

Eight tests cover normalized replay, conflicting content, new keys, invalid data,
injected DB failure, caller transaction rejection, and two concurrent connections
with either identical or different payloads. Each parallel test owns a temporary
database; either writer may win when contents differ.

The primary key is a business record ID, not a separate request idempotency key.
BEGIN IMMEDIATE serializes the short write/check transaction in SQLite. A busy
timeout is not a retry policy, and this does not prove Oracle/PostgreSQL behavior.
Writes are atomic per record, not per CSV file or batch. There is no durable audit
log or stored response replay. Conflicts do not overwrite or merge existing data.
