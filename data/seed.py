# Script to seed domain-specific tables with dummy data using Faker

import sqlite3
from faker import Faker
import random
from datetime import datetime, timedelta

DB_PATH = "poc.db"
NUM_ROWS = 50
fake = Faker()

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Finance domain: transactions, accounts
c.execute("""
CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY, name TEXT, type TEXT, balance REAL, opened DATE
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY, account_id INTEGER, amount REAL, date DATE, description TEXT,
    FOREIGN KEY(account_id) REFERENCES finance_accounts(id)
)
""")

# HR domain: employees, payroll
c.execute("""
CREATE TABLE IF NOT EXISTS hr_employees (
    id INTEGER PRIMARY KEY, name TEXT, email TEXT, department TEXT, hire_date DATE
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS hr_payroll (
    id INTEGER PRIMARY KEY, employee_id INTEGER, salary REAL, pay_date DATE,
    FOREIGN KEY(employee_id) REFERENCES hr_employees(id)
)
""")

# Healthcare domain: patients, appointments
c.execute("""
CREATE TABLE IF NOT EXISTS healthcare_patients (
    id INTEGER PRIMARY KEY, name TEXT, dob DATE, gender TEXT, insurance TEXT
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS healthcare_appointments (
    id INTEGER PRIMARY KEY, patient_id INTEGER, doctor TEXT, date DATE, reason TEXT,
    FOREIGN KEY(patient_id) REFERENCES healthcare_patients(id)
)
""")

# Wireless/Telecom domain: customers, plans, usage
c.execute("""
CREATE TABLE IF NOT EXISTS wireless_customers (
    id INTEGER PRIMARY KEY, name TEXT, phone TEXT, signup_date DATE
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS wireless_usage (
    id INTEGER PRIMARY KEY, customer_id INTEGER, data_used REAL, minutes_used INTEGER, usage_date DATE,
    FOREIGN KEY(customer_id) REFERENCES wireless_customers(id)
)
""")

# Populate Finance
types = ["Checking", "Savings", "Credit"]
for _ in range(NUM_ROWS):
    c.execute("INSERT INTO finance_accounts (name, type, balance, opened) VALUES (?, ?, ?, ?)",
              (fake.company(), random.choice(types), round(random.uniform(100, 10000), 2), fake.date_this_decade()))
for acc_id in range(1, NUM_ROWS+1):
    for _ in range(random.randint(2, 6)):
        c.execute("INSERT INTO finance_transactions (account_id, amount, date, description) VALUES (?, ?, ?, ?)",
                  (acc_id, round(random.uniform(-500, 2000), 2), fake.date_this_year(), fake.bs()))

# Populate HR
for _ in range(NUM_ROWS):
    c.execute("INSERT INTO hr_employees (name, email, department, hire_date) VALUES (?, ?, ?, ?)",
              (fake.name(), fake.email(), fake.job(), fake.date_this_decade()))
for emp_id in range(1, NUM_ROWS+1):
    for _ in range(random.randint(1, 3)):
        c.execute("INSERT INTO hr_payroll (employee_id, salary, pay_date) VALUES (?, ?, ?)",
                  (emp_id, round(random.uniform(40000, 150000), 2), fake.date_this_year()))

# Populate Healthcare
genders = ["Male", "Female", "Other"]
for _ in range(NUM_ROWS):
    c.execute("INSERT INTO healthcare_patients (name, dob, gender, insurance) VALUES (?, ?, ?, ?)",
              (fake.name(), fake.date_of_birth(minimum_age=0, maximum_age=90), random.choice(genders), fake.company()))
for pat_id in range(1, NUM_ROWS+1):
    for _ in range(random.randint(1, 4)):
        c.execute("INSERT INTO healthcare_appointments (patient_id, doctor, date, reason) VALUES (?, ?, ?, ?)",
                  (pat_id, fake.name(), fake.date_this_year(), fake.sentence(nb_words=6)))

# Populate Wireless/Telecom
for _ in range(NUM_ROWS):
    c.execute("INSERT INTO wireless_customers (name, phone, signup_date) VALUES (?, ?, ?)",
              (fake.name(), fake.phone_number(), fake.date_this_decade()))
for cust_id in range(1, NUM_ROWS+1):
    for _ in range(random.randint(2, 5)):
        c.execute("INSERT INTO wireless_usage (customer_id, data_used, minutes_used, usage_date) VALUES (?, ?, ?, ?)",
                  (cust_id, round(random.uniform(0.1, 20.0), 2), random.randint(10, 1000), fake.date_this_year()))

conn.commit()
conn.close()
print("Database seeded with domain-specific dummy data.")
