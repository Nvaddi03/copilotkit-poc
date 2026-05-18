# SQLite tools: query_db, insert_row, update_row, summarize_table
from .db_utils import query_db, execute_db
from typing import List, Dict, Any
import re

def get_table_names() -> List[str]:
    rows = query_db("SELECT name FROM sqlite_master WHERE type='table'")
    return [row['name'] for row in rows]

def get_table_schema(table: str) -> List[Dict[str, Any]]:
    rows = query_db(f"PRAGMA table_info({table})")
    return rows

def select_all(table: str) -> List[Dict[str, Any]]:
    return query_db(f"SELECT * FROM {table}")

def summarize_table(table: str) -> Dict[str, Any]:
    schema = get_table_schema(table)
    count = query_db(f"SELECT COUNT(*) as count FROM {table}")[0]['count']
    return {"schema": schema, "row_count": count}


# Safe identifier check to prevent SQL injection on column/table names.
_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _check_ident(name: str, kind: str) -> None:
    if not _IDENT_RE.match(name or ""):
        raise ValueError(f"Invalid {kind} name: {name!r}")


def _clamp_limit(limit: int, default: int = 20, hi: int = 200) -> int:
    try:
        return max(1, min(int(limit), hi))
    except Exception:
        return default


def group_by_count(table: str, column: str, limit: int = 20) -> List[Dict[str, Any]]:
    """COUNT(*) GROUP BY <column>, ordered DESC. Returns [{name, value}, ...]."""
    _check_ident(table, "table")
    _check_ident(column, "column")
    limit = _clamp_limit(limit)
    sql = (
        f"SELECT {column} AS name, COUNT(*) AS value "
        f"FROM {table} WHERE {column} IS NOT NULL "
        f"GROUP BY {column} ORDER BY value DESC LIMIT {limit}"
    )
    return query_db(sql)


def group_by_sum(table: str, group_col: str, value_col: str, limit: int = 20) -> List[Dict[str, Any]]:
    """SUM(<value_col>) GROUP BY <group_col>, ordered DESC. Returns [{name, value}, ...]."""
    _check_ident(table, "table")
    _check_ident(group_col, "group_col")
    _check_ident(value_col, "value_col")
    limit = _clamp_limit(limit)
    sql = (
        f"SELECT {group_col} AS name, COALESCE(SUM({value_col}),0) AS value "
        f"FROM {table} WHERE {group_col} IS NOT NULL "
        f"GROUP BY {group_col} ORDER BY value DESC LIMIT {limit}"
    )
    return query_db(sql)


def group_by_avg(table: str, group_col: str, value_col: str, limit: int = 20) -> List[Dict[str, Any]]:
    """AVG(<value_col>) GROUP BY <group_col>, ordered DESC. Returns [{name, value}, ...]."""
    _check_ident(table, "table")
    _check_ident(group_col, "group_col")
    _check_ident(value_col, "value_col")
    limit = _clamp_limit(limit)
    sql = (
        f"SELECT {group_col} AS name, ROUND(COALESCE(AVG({value_col}),0), 2) AS value "
        f"FROM {table} WHERE {group_col} IS NOT NULL "
        f"GROUP BY {group_col} ORDER BY value DESC LIMIT {limit}"
    )
    return query_db(sql)


def time_series(
    table: str,
    date_col: str,
    value_col: str = "",
    bucket: str = "month",
    limit: int = 60,
) -> List[Dict[str, Any]]:
    """Time-bucketed series. bucket ∈ {day, month, year}.
    If value_col is empty → COUNT(*). Else → SUM(value_col).
    Returns [{name: <bucket label>, value: <num>}, ...] ordered ascending.
    """
    _check_ident(table, "table")
    _check_ident(date_col, "date_col")
    if value_col:
        _check_ident(value_col, "value_col")
    bucket = (bucket or "month").lower()
    fmt = {"day": "%Y-%m-%d", "month": "%Y-%m", "year": "%Y"}.get(bucket, "%Y-%m")
    limit = _clamp_limit(limit, default=60, hi=500)
    agg = f"COALESCE(SUM({value_col}),0)" if value_col else "COUNT(*)"
    sql = (
        f"SELECT strftime('{fmt}', {date_col}) AS name, {agg} AS value "
        f"FROM {table} WHERE {date_col} IS NOT NULL "
        f"GROUP BY name ORDER BY name ASC LIMIT {limit}"
    )
    return query_db(sql)


def top_n(table: str, order_col: str, limit: int = 10, descending: bool = True) -> List[Dict[str, Any]]:
    """Return the top-N rows of <table> ordered by <order_col>."""
    _check_ident(table, "table")
    _check_ident(order_col, "order_col")
    limit = _clamp_limit(limit, default=10, hi=100)
    direction = "DESC" if descending else "ASC"
    sql = f"SELECT * FROM {table} ORDER BY {order_col} {direction} LIMIT {limit}"
    return query_db(sql)


def run_sql(sql: str) -> List[Dict[str, Any]]:
    """Read-only SELECT escape hatch. Rejects any non-SELECT statement.

    Use this only when none of the structured tools fit — e.g. a JOIN or a
    complex WHERE filter. Must be a single SELECT, no semicolons except a
    trailing one, no PRAGMA / ATTACH / INSERT / UPDATE / DELETE / DROP.
    """
    if not isinstance(sql, str):
        raise ValueError("sql must be a string")
    s = sql.strip().rstrip(";").strip()
    if ";" in s:
        raise ValueError("Only a single statement is allowed")
    low = s.lower()
    if not low.startswith(("select ", "with ")):
        raise ValueError("Only SELECT / WITH queries are allowed")
    banned = (
        " insert ", " update ", " delete ", " drop ", " alter ",
        " attach ", " detach ", " pragma ", " create ", " replace ",
    )
    padded = f" {low} "
    for b in banned:
        if b in padded:
            raise ValueError(f"Disallowed keyword: {b.strip()}")
    # Hard cap rows for safety
    if " limit " not in low:
        s = f"{s} LIMIT 500"
    return query_db(s)
