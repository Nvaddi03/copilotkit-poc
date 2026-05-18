"""
RAG (Retrieval-Augmented Generation) tool.

Uses FAISS + simple text chunking for in-memory semantic search over
domain knowledge docs. No external services required.

The documents cover:
- Finance policies and KPIs
- HR policies and org structure
- Healthcare compliance notes
- Wireless plan details
"""

from __future__ import annotations
import os
from typing import List
from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import CharacterTextSplitter

# ── In-memory knowledge base ──────────────────────────────────────────────

DOMAIN_DOCS = [
    {
        "source": "finance-policy",
        "content": """
Finance Department Policy Manual v3.2

Budget Approval Thresholds:
- Team lead: up to $5,000 per request
- Department manager: up to $25,000 per request
- VP Finance: up to $100,000 per request
- CFO approval required: above $100,000

Key Financial KPIs tracked quarterly:
- Revenue Growth Rate (target: 15% YoY)
- Operating Expense Ratio (target: < 65%)
- EBITDA Margin (target: > 20%)
- Days Sales Outstanding (target: < 45 days)
- Current Ratio (target: > 1.5)

Q4 Finance Summary:
Total revenue reached $4.2M in Q4, up 18% from Q3.
Operating expenses came in at $2.7M (64% ratio - on target).
Three accounts flagged for late payment exceeding 90 days.
Capital expenditure for the year totaled $890K.

Cost Center Breakdown:
- Engineering & Product: 38% of OpEx
- Sales & Marketing: 28% of OpEx
- G&A: 22% of OpEx
- Customer Success: 12% of OpEx
""",
    },
    {
        "source": "hr-policy",
        "content": """
Human Resources Policy Handbook v5.1

Leave Policies:
- Annual Leave: 20 days per year (pro-rated for new hires)
- Sick Leave: 10 days per year, non-accumulating
- Parental Leave: 16 weeks fully paid (primary carer), 4 weeks (secondary)
- Bereavement Leave: up to 5 days for immediate family

Performance Review Cycle:
- Mid-year check-in: July (informal, manager-led)
- Annual review: December (formal, 360 feedback)
- Promotion committee: January and July cycles

Salary Band Guidelines (2025):
- L1 (Junior): $55K - $75K
- L2 (Mid): $75K - $100K
- L3 (Senior): $100K - $140K
- L4 (Staff): $140K - $180K
- L5 (Principal): $180K - $230K

Headcount Summary:
Total employees: 312 across all departments.
Engineering is the largest dept at 89 headcount.
Average tenure: 3.2 years.
Voluntary attrition YTD: 8.4% (industry avg: 12%).

Remote Work Policy:
All employees eligible for hybrid (3 days in office).
Fully remote approved for roles in non-hub cities.
""",
    },
    {
        "source": "healthcare-compliance",
        "content": """
Healthcare Operations Compliance Guide v2.0

HIPAA Compliance Requirements:
- All patient data must be encrypted at rest (AES-256) and in transit (TLS 1.3+)
- Access logs retained for minimum 6 years
- Breach notification required within 72 hours to HHS
- Annual HIPAA training mandatory for all staff with PHI access

Patient Care Metrics (Q3 2025):
- Average appointment wait time: 4.2 days (target: < 5 days)
- Patient satisfaction score: 87% (target: > 85%)
- No-show rate: 14% (industry avg: 20%)
- Readmission rate (30-day): 6.8% (target: < 8%)

Appointment Types:
- Initial Consultation: 60 min
- Follow-up: 30 min
- Annual Physical: 45 min
- Specialist Referral: 45 min

Insurance Coverage Mix:
- Medicare: 28% of patients
- Medicaid: 22% of patients
- Private Insurance: 41% of patients
- Self-Pay: 9% of patients

Critical Compliance Deadlines:
- CMS quality reporting: March 31 annually
- State licensing renewal: varies by state
- Equipment calibration certification: every 6 months
""",
    },
    {
        "source": "wireless-plans",
        "content": """
Wireless Services Product Guide v4.3

Current Plan Portfolio:
1. Basic Plan — $29/month
   - 5 GB data, 500 minutes, 1000 SMS
   - No international roaming
   - Ideal for light users

2. Standard Plan — $49/month
   - 20 GB data, unlimited minutes, unlimited SMS
   - Basic international roaming (30 countries)
   - Mobile hotspot: 5 GB included

3. Premium Plan — $79/month
   - Unlimited data (throttled after 50 GB)
   - Unlimited minutes and SMS globally
   - International roaming: 80 countries
   - Mobile hotspot: 30 GB included
   - Priority network access during congestion

4. Enterprise Plan — $120/month per line (min 10 lines)
   - Unlimited everything
   - Dedicated account manager
   - SLA: 99.9% uptime guarantee
   - Advanced analytics dashboard

Network Performance:
- 5G coverage: 68% of service area
- 4G LTE coverage: 99.2% of service area
- Average download speed (5G): 450 Mbps
- Average download speed (4G): 42 Mbps
- Customer satisfaction (NPS): 67

Churn Analysis:
- Monthly churn rate: 1.8% (industry avg: 2.5%)
- Primary churn reason: price (41%), coverage (28%), competitor offer (22%)
- Average customer lifetime: 4.6 years
- Customer Lifetime Value (CLV): $2,800 average
""",
    },
]

# ── Build FAISS index ─────────────────────────────────────────────────────

_vectorstore: FAISS | None = None


def _get_vectorstore() -> FAISS:
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    splitter = CharacterTextSplitter(chunk_size=400, chunk_overlap=60)
    texts: List[str] = []
    metadatas: List[dict] = []

    for doc in DOMAIN_DOCS:
        chunks = splitter.split_text(doc["content"])
        for chunk in chunks:
            texts.append(chunk)
            metadatas.append({"source": doc["source"]})

    embeddings = OpenAIEmbeddings()
    _vectorstore = FAISS.from_texts(texts, embeddings, metadatas=metadatas)
    return _vectorstore


# ── Exported tool ─────────────────────────────────────────────────────────

@tool
def search_documents(query: str, k: int = 4) -> List[dict]:
    """Semantic search over domain knowledge documents.

    Searches Finance policies, HR handbook, Healthcare compliance guide,
    and Wireless plan catalog. Use this when the user asks about:
    - Policies (leave, budget approval, HIPAA, etc.)
    - KPI targets or thresholds
    - Plan details, pricing, or coverage
    - Compliance requirements or deadlines

    Returns the top-k most relevant text chunks with their source.
    """
    try:
        store = _get_vectorstore()
        results = store.similarity_search(query, k=k)
        return [
            {"source": r.metadata.get("source", "unknown"), "content": r.page_content.strip()}
            for r in results
        ]
    except Exception as e:
        return [{"error": f"{type(e).__name__}: {e}"}]
