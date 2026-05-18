# SQLite utility functions for CopilotKit tools
import sqlite3
from typing import Any, List, Dict

DB_PATH = "../data/poc.db"

def query_db(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def execute_db(query: str, params: tuple = ()) -> int:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query, params)
    conn.commit()
    lastrowid = cur.lastrowid
    conn.close()
    return lastrowid
