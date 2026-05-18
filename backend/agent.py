# LangGraph agent definition for CopilotKit
import os
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from copilotkit import CopilotKitMiddleware, CopilotKitState
from langgraph.checkpoint.memory import MemorySaver
# NOTE: The ag_ui_langgraph adapter requires a checkpointer (it calls
# graph.aget_state(config) on every request). MemorySaver is the simplest
# in-process implementation. The frontend sends the full message history
# each turn, so the checkpoint is effectively overwritten per request —
# we do NOT rely on it for memory.

from tools.sqlite_tools import (
    get_table_names as _get_table_names,
    get_table_schema as _get_table_schema,
    select_all as _select_all,
    summarize_table as _summarize_table,
    group_by_count as _group_by_count,
    group_by_sum as _group_by_sum,
    group_by_avg as _group_by_avg,
    time_series as _time_series,
    top_n as _top_n,
    run_sql as _run_sql,
)
from tools.analytics_tools import (
    get_finance_summary as _get_finance_summary,
    get_hr_summary as _get_hr_summary,
    get_healthcare_summary as _get_healthcare_summary,
    get_wireless_summary as _get_wireless_summary,
)

PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompt_instructions.txt")


def get_system_prompt() -> str:
    with open(PROMPT_PATH, "r") as f:
        return f.read()


# Wrap plain functions as LangChain tools so the LLM can call them.
#
# IMPORTANT: every tool must NEVER raise — a raised exception inside a
# LangGraph tool node aborts the whole graph run, which tears down the
# AG-UI SSE stream and surfaces in the UI as
# `agent_run_error_event: terminated / INCOMPLETE_STREAM`.
# Instead we catch and return a short error string; the LLM can read it
# and recover (e.g. by calling list_tables to discover the right name).

def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"}


@tool
def list_tables() -> List[str]:
    """List all tables in the SQLite database."""
    return _safe(_get_table_names)


@tool
def table_schema(table: str) -> List[Dict[str, str]]:
    """Get the column schema for a given table as a list of column definitions.
    If the table does not exist, returns an error dict; first call list_tables
    to discover available names (they are prefixed by domain, e.g.
    finance_transactions, hr_employees)."""
    return _safe(_get_table_schema, table)


@tool
def select_all_rows(table: str) -> List[Dict[str, str]]:
    """Select all rows from the given table. Table names are domain-prefixed
    (finance_*, hr_*, healthcare_*, wireless_*). Call list_tables first if
    unsure. Returns an error dict on failure instead of raising."""
    return _safe(_select_all, table)


@tool
def summarize_table(table: str) -> Dict[str, int]:
    """Get schema and row count for a table. Returns an error dict on failure."""
    return _safe(_summarize_table, table)


@tool
def group_by_count(table: str, column: str, limit: int = 20) -> List[Dict[str, str]]:
    """Aggregate rows as COUNT(*) GROUP BY <column> ordered DESC.

    Returns chart-ready data: a list of {"name": <category>, "value": <count>}.
    USE THIS for ANY "X by Y" / "headcount by department" / "patients by status"
    style chart instead of select_all_rows + manual aggregation. Always call
    this when the user asks for a chart of category counts."""
    return _safe(_group_by_count, table, column, limit)


@tool
def group_by_sum(table: str, group_col: str, value_col: str, limit: int = 20) -> List[Dict[str, str]]:
    """Aggregate as SUM(value_col) GROUP BY group_col ORDER BY value DESC.
    Returns [{name, value}, ...]. Use for "total <X> by <Y>" charts, e.g.
    "total payroll by department" → group_by_sum('hr_payroll','department','salary')
    or "total data used by plan" → group_by_sum('wireless_usage','plan','data_used')."""
    return _safe(_group_by_sum, table, group_col, value_col, limit)


@tool
def group_by_avg(table: str, group_col: str, value_col: str, limit: int = 20) -> List[Dict[str, str]]:
    """Aggregate as AVG(value_col) GROUP BY group_col ORDER BY value DESC.
    Returns [{name, value}, ...]. Use for "average <X> by <Y>" charts, e.g.
    "average salary by department" → group_by_avg('hr_payroll','department','salary')."""
    return _safe(_group_by_avg, table, group_col, value_col, limit)


@tool
def time_series(
    table: str,
    date_col: str,
    value_col: str = "",
    bucket: str = "month",
    limit: int = 60,
) -> List[Dict[str, str]]:
    """Time-bucketed series. bucket ∈ 'day'|'month'|'year'.
    If value_col is empty → COUNT(*) per bucket; else → SUM(value_col) per bucket.
    Returns [{name:<bucket>, value:<num>}, ...] ordered ascending — perfect for
    line/area charts. Examples:
      "hires per month"           → time_series('hr_employees','hire_date','','month')
      "transactions per day"      → time_series('finance_transactions','date','','day')
      "monthly revenue"           → time_series('finance_transactions','date','amount','month')."""
    return _safe(_time_series, table, date_col, value_col, bucket, limit)


@tool
def top_n(table: str, order_col: str, limit: int = 10, descending: bool = True) -> List[Dict[str, str]]:
    """Return the top-N rows of <table> ordered by <order_col>. Use for "top 5
    customers by data usage", "highest paid employees", etc."""
    return _safe(_top_n, table, order_col, limit, descending)


@tool
def run_sql(sql: str) -> List[Dict[str, str]]:
    """Run a READ-ONLY SELECT (or WITH ... SELECT) against the SQLite db.
    Only use when no structured tool fits — e.g. JOINs or complex filters.
    Single statement only; INSERT/UPDATE/DELETE/DROP/PRAGMA are rejected.
    Always alias columns to `name` and `value` if the result will feed a chart."""
    return _safe(_run_sql, sql)


@tool
def finance_summary() -> Dict[str, int]:
    """Summarize finance accounts and transactions (tables: finance_accounts, finance_transactions)."""
    return _safe(_get_finance_summary)


@tool
def hr_summary() -> Dict[str, int]:
    """Summarize HR employees and payroll (tables: hr_employees, hr_payroll)."""
    return _safe(_get_hr_summary)


@tool
def healthcare_summary() -> Dict[str, int]:
    """Summarize healthcare patients and appointments (tables: healthcare_patients, healthcare_appointments)."""
    return _safe(_get_healthcare_summary)


@tool
def wireless_summary() -> Dict[str, int]:
    """Summarize wireless customers and usage (tables: wireless_customers, wireless_usage)."""
    return _safe(_get_wireless_summary)


def build_agent():
    """Build a LangGraph agent using CopilotKit's official middleware.

    ``CopilotKitMiddleware`` (from the ``copilotkit`` package) handles:
      * ``wrap_model_call`` — merges frontend tools (e.g. ``renderUI`` from
        ``useCopilotAction``) from ``state["copilotkit"]["actions"]`` into the
        model's tool list BEFORE every LLM invocation, so the model can
        actually call them.
      * ``after_model`` — strips frontend tool calls from the AIMessage so
        the local ToolNode doesn't try to execute them.
      * ``after_agent`` — restores them on the AIMessage so the AG-UI SSE
        stream forwards them to the browser, where the matching
        ``useCopilotAction`` handler runs and renders the chart.

    This replaces the previous hand-rolled graph; see the docs at
    https://docs.langchain.com/oss/python/langchain/frontend/integrations/copilotkit
    for the canonical pattern.
    """
    model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    llm = ChatOpenAI(model=model_name, temperature=0)

    backend_tools = [
        list_tables,
        table_schema,
        select_all_rows,
        summarize_table,
        group_by_count,
        group_by_sum,
        group_by_avg,
        time_series,
        top_n,
        run_sql,
        finance_summary,
        hr_summary,
        healthcare_summary,
        wireless_summary,
    ]

    return create_agent(
        model=llm,
        tools=backend_tools,
        middleware=[CopilotKitMiddleware()],
        state_schema=CopilotKitState,
        system_prompt=get_system_prompt(),
        checkpointer=MemorySaver(),
    )
