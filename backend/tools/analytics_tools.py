# Analytics tools for CopilotKit agent
from .db_utils import query_db
from typing import Dict, Any

def get_finance_summary() -> Dict[str, Any]:
    accounts = query_db("SELECT COUNT(*) as count, SUM(balance) as total_balance FROM finance_accounts")[0]
    transactions = query_db("SELECT COUNT(*) as count, SUM(amount) as total_amount FROM finance_transactions")[0]
    return {"accounts": accounts, "transactions": transactions}

def get_hr_summary() -> Dict[str, Any]:
    employees = query_db("SELECT COUNT(*) as count FROM hr_employees")[0]
    payroll = query_db("SELECT COUNT(*) as count, AVG(salary) as avg_salary FROM hr_payroll")[0]
    return {"employees": employees, "payroll": payroll}

def get_healthcare_summary() -> Dict[str, Any]:
    patients = query_db("SELECT COUNT(*) as count FROM healthcare_patients")[0]
    appointments = query_db("SELECT COUNT(*) as count FROM healthcare_appointments")[0]
    return {"patients": patients, "appointments": appointments}

def get_wireless_summary() -> Dict[str, Any]:
    customers = query_db("SELECT COUNT(*) as count FROM wireless_customers")[0]
    usage = query_db("SELECT COUNT(*) as count, SUM(data_used) as total_data, SUM(minutes_used) as total_minutes FROM wireless_usage")[0]
    return {"customers": customers, "usage": usage}
