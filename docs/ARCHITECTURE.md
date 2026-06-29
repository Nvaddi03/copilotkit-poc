# CopilotKit POC - Architecture Overview

## System Architecture Flow

```mermaid
graph TB
    subgraph "Frontend - Next.js 14"
        UI[React UI Components]
        CK[CopilotKit Provider]
        Chat[CopilotChat/Sidebar/Popup]
        Actions[useCopilotAction Handlers]
        Readable[useCopilotReadable Context]
    end

    subgraph "Transport Layer"
        Runtime[CopilotKit Runtime API<br/>/api/copilotkit]
    end

    subgraph "Backend - FastAPI + LangGraph"
        SDK[CopilotKit SDK]
        Agent[LangGraph Agent<br/>copilotkit-agent]
        Tools[Backend Tools<br/>@tool decorators]
        DB[(SQLite Database<br/>Finance, HR,<br/>Healthcare, Wireless)]
    end

    subgraph "MCP Servers - Live Data Scraping"
        VZ[Verizon MCP<br/>Port 8001]
        ATT[AT&T MCP<br/>Port 8002]
        TM[T-Mobile MCP<br/>Port 8003]
        
        subgraph "Each MCP Server"
            Scraper[Playwright Scraper]
            Cache[1-Hour Cache]
            API[FastAPI Endpoints]
        end
    end

    subgraph "External Data Sources"
        VZWEB[Verizon.com<br/>Live Website]
        ATTWEB[ATT.com<br/>Live Website]
        TMWEB[T-Mobile.com<br/>Live Website]
    end

    UI --> CK
    CK --> Chat
    Chat --> Actions
    Chat --> Readable
    
    Actions -->|WebSocket| Runtime
    Readable -->|Context| Runtime
    
    Runtime <-->|HTTP + Streaming| SDK
    SDK --> Agent
    Agent --> Tools
    Tools --> DB
    
    Agent -->|HTTP Requests| VZ
    Agent -->|HTTP Requests| ATT
    Agent -->|HTTP Requests| TM
    
    VZ --> Scraper
    ATT --> Scraper
    TM --> Scraper
    
    Scraper -->|Web Scraping| VZWEB
    Scraper -->|Web Scraping| ATTWEB
    Scraper -->|Web Scraping| TMWEB
    
    Scraper --> Cache
    Cache --> API
    API -->|JSON Response| Agent

    style CK fill:#4CAF50
    style Runtime fill:#2196F3
    style Agent fill:#FF9800
    style VZ fill:#E53935
    style ATT fill:#1976D2
    style TM fill:#9C27B0
    style Scraper fill:#FFC107
```

## Data Flow - Carrier Comparison Example

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant CK as CopilotKit
    participant Agent as LangGraph Agent
    participant VZ as Verizon MCP
    participant ATT as AT&T MCP
    participant TM as T-Mobile MCP
    participant Web as Carrier Websites

    User->>UI: "Compare iPhone 17 Pro prices"
    UI->>CK: User message via CopilotChat
    CK->>Agent: Forward request + context
    
    Agent->>Agent: Classify intent:<br/>Multi-carrier comparison
    
    par Parallel Scraping
        Agent->>VZ: GET /tools/get_device_info<br/>{device: "iphone-17-pro", storage: "256GB"}
        VZ->>VZ: Check cache (1hr TTL)
        alt Cache Miss
            VZ->>Web: Scrape Verizon.com (Playwright)
            Web-->>VZ: HTML + Pricing data
            VZ->>VZ: Parse & cache
        end
        VZ-->>Agent: {price_monthly: 30.56, price_full: 1099}
    and
        Agent->>ATT: GET /tools/get_device_info
        ATT->>ATT: Check cache
        alt Cache Miss
            ATT->>Web: Scrape ATT.com
            Web-->>ATT: HTML + Pricing
        end
        ATT-->>Agent: {price_monthly: 30.56, price_full: 1099}
    and
        Agent->>TM: GET /tools/get_device_info
        TM->>TM: Check cache
        alt Cache Miss
            TM->>Web: Scrape T-Mobile.com
            Web-->>TM: HTML + Pricing
        end
        TM-->>Agent: {price_monthly: 29.99, price_full: 1079}
    end
    
    Agent->>Agent: Compare prices<br/>Identify best deal
    Agent->>CK: Call renderCarrierComparison action
    CK->>UI: Render comparison table
    UI->>User: Display results with 🏆 Best Price indicator
```

## Declarative UI Flow (L4) - "Build a Wireless Dashboard"

```mermaid
sequenceDiagram
    participant User
    participant UI as React Frontend<br/>(declarative/page.tsx)
    participant Action as useCopilotAction<br/>(buildDashboard)
    participant Agent as LangGraph Agent<br/>(Backend)
    participant Tools as Backend Tools<br/>(DB + Group By)
    participant DB as SQLite Database
    participant Components as React Components<br/>(KpiCard, ChartCard, DataTable)

    User->>UI: "Build a wireless dashboard"
    UI->>Action: Register buildDashboard action<br/>(parameters: title, stats, charts, tables, callouts)
    UI->>Agent: Send user message via CopilotPopup
    
    Note over Agent: Agent analyzes request:<br/>"Need wireless data + dashboard layout"
    
    Agent->>Tools: wireless_summary()
    Tools->>DB: SELECT COUNT(*), SUM(data_used_gb)...
    DB-->>Tools: {subscribers: 50, total_gb: 1717, minutes: 88328}
    Tools-->>Agent: Summary totals
    
    Agent->>Tools: group_by_count("wireless_customers", "plan_type")
    Tools->>DB: SELECT plan_type, COUNT(*) GROUP BY plan_type
    DB-->>Tools: [{Basic: 32}, {Premium: 18}]
    Tools-->>Agent: Plan distribution data
    
    Agent->>Tools: group_by_sum("wireless_usage", "signup_month", "data_used_gb")
    Tools->>DB: SELECT signup_month, SUM(data_used_gb) GROUP BY signup_month
    DB-->>Tools: [{Jan: 120}, {Feb: 145}, {Mar: 167}...]
    Tools-->>Agent: Monthly usage data
    
    Note over Agent: Agent decides:<br/>✓ Categorical data → PIE chart<br/>✓ Time series → BAR chart<br/>✓ Build complete payload
    
    Agent->>Action: buildDashboard({<br/>  title: "Wireless Analytics Dashboard",<br/>  stats: [<br/>    {label: "Total Subscribers", value: 50, trend: "up"},<br/>    {label: "Total Data (GB)", value: 1717}<br/>  ],<br/>  charts: [<br/>    {kind: "pie", title: "Plan Distribution", data: [...]},<br/>    {kind: "bar", title: "Monthly Usage", data: [...]}<br/>  ]<br/>})
    
    Action->>UI: handler() executes<br/>setDashboard(payload)
    
    UI->>Components: Render dashboard with data
    Components->>Components: KpiCard: Apply gradient colors<br/>ChartCard: Route to GenPieChart/GenChart<br/>DataTable: Build HTML table
    
    Components-->>UI: Rendered dashboard HTML
    UI-->>User: Display complete dashboard<br/>✅ KPI cards with gradients<br/>✅ Pie + Bar charts<br/>✅ AI insights
    
    Note over User,Components: Backend = Brain (decides WHAT)<br/>Frontend = Renderer (knows HOW)
```

### Key Concepts - Declarative UI

| Layer | Role | Example |
|-------|------|---------|
| **User** | Describes intent | "Build a wireless dashboard" |
| **Backend Agent** | Decides structure & data | Calls DB tools, chooses chart types ("pie", "bar"), structures payload |
| **useCopilotAction** | Action contract | Defines `buildDashboard(title, stats, charts, tables, callouts)` |
| **Frontend Handler** | State update | `setDashboard(payload)` → triggers React re-render |
| **React Components** | Visual rendering | `<KpiCard>`, `<ChartCard>`, `<DataTable>` render with Tailwind styling |

**Why "Declarative"?**  
The agent **declares** the UI structure (stats array, charts array with `kind` property) without writing React/HTML code. Frontend components know **how** to render any structure the agent provides.

---

## Component Architecture

```mermaid
graph LR
    subgraph "11 Pages - Different CopilotKit Features"
        P1[Dashboard<br/>CopilotSidebar<br/>Charts + Observability]
        P2[Controlled GenUI<br/>CopilotPopup<br/>L3 Typed Render]
        P3[Declarative GenUI<br/>CopilotPopup<br/>L4 buildDashboard]
        P4[Open GenUI<br/>CopilotChat<br/>L2 Streaming + L5 Registry]
        P5[HITL<br/>CopilotSidebar<br/>renderAndWait Approval]
        P6[Chat<br/>CopilotChat<br/>useChatContext]
        P7[Multi-Agent<br/>CopilotChat<br/>useCoAgent Routing]
        P8[RAG<br/>CopilotChat<br/>FAISS Vector Search]
        P9[Multimodal<br/>CopilotChat<br/>GPT-4o Vision]
        P10[Voice<br/>CopilotChat<br/>STT + TTS]
        P11[Carrier Comparison<br/>CopilotChat<br/>MCP Servers]
    end

    subgraph "CopilotKit Primitives"
        Prov[CopilotKit Provider]
        Action[useCopilotAction]
        Read[useCopilotReadable]
        Context[useChatContext]
        CoAgent[useCoAgent]
        Hooks[CopilotObservabilityHooks]
    end

    P1 --> Prov
    P2 --> Prov
    P3 --> Prov
    P4 --> Prov
    P5 --> Prov
    P6 --> Prov
    P7 --> Prov
    P8 --> Prov
    P9 --> Prov
    P10 --> Prov
    P11 --> Prov

    Prov --> Action
    Prov --> Read
    Prov --> Context
    Prov --> CoAgent
    Prov --> Hooks

    style P11 fill:#E1BEE7
    style Prov fill:#4CAF50
```

## MCP Server Architecture - 100% Live Scraping

```mermaid
graph TB
    subgraph "MCP Server (Verizon/AT&T/T-Mobile)"
        FastAPI[FastAPI Server<br/>Port 8001-8003]
        
        subgraph "Endpoints"
            E1[GET /tools/get_device_info]
            E2[GET /tools/get_plans]
            E3[GET /tools/calculate_total_cost]
            E4[GET /health]
        end
        
        subgraph "Scrapers"
            DevScraper[Device Scraper<br/>scraper.py]
            PlanScraper[Plan Scraper<br/>plan_scraper.py]
        end
        
        subgraph "Cache Layer"
            DevCache[Device Cache<br/>1hr TTL]
            PlanCache[Plan Cache<br/>1hr TTL]
        end
        
        subgraph "Web Scraping Stack"
            Playwright[Playwright<br/>Headless Chromium]
            BS4[BeautifulSoup<br/>HTML Parsing]
        end
    end

    FastAPI --> E1
    FastAPI --> E2
    FastAPI --> E3
    FastAPI --> E4
    
    E1 --> DevCache
    E2 --> PlanCache
    
    DevCache -->|Cache Miss| DevScraper
    PlanCache -->|Cache Miss| PlanScraper
    
    DevScraper --> Playwright
    PlanScraper --> Playwright
    
    Playwright --> BS4
    BS4 -->|Parsed Data| DevScraper
    BS4 -->|Parsed Data| PlanScraper
    
    DevScraper -->|Update| DevCache
    PlanScraper -->|Update| PlanCache
    
    DevCache -->|Cache Hit| E1
    PlanCache -->|Cache Hit| E2

    style FastAPI fill:#FF9800
    style Playwright fill:#4CAF50
    style DevCache fill:#2196F3
    style PlanCache fill:#2196F3
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        Next[Next.js 14<br/>App Router]
        React[React 18]
        TS[TypeScript]
        Tailwind[Tailwind CSS]
        CKLib[@copilotkit 1.10.5]
    end

    subgraph "Backend"
        FastAPI[FastAPI]
        LangGraph[LangGraph]
        LangChain[LangChain]
        Pydantic[Pydantic]
    end

    subgraph "AI/ML"
        OpenAI[OpenAI GPT-4o]
        FAISS[FAISS Vector DB]
    end

    subgraph "Scraping"
        PW[Playwright]
        BS[BeautifulSoup4]
    end

    subgraph "Data"
        SQLite[SQLite Database]
        Cache[In-Memory Cache]
    end

    Next --> React
    Next --> TS
    Next --> Tailwind
    Next --> CKLib
    
    CKLib --> FastAPI
    FastAPI --> LangGraph
    LangGraph --> LangChain
    LangGraph --> OpenAI
    
    FastAPI --> SQLite
    FastAPI --> FAISS
    
    FastAPI --> PW
    PW --> BS
    
    FastAPI --> Cache
```

## Key Features by Layer

### Frontend Layer
- **10 Demo Pages** - Each showcasing different CopilotKit primitives
- **3 UI Components** - CopilotSidebar, CopilotPopup, CopilotChat
- **67 CopilotKit Features** - 50 implemented, 17 N/A or OSS-only
- **Real-time UI Updates** - Actions trigger instant UI rendering

### Transport Layer
- **CopilotKit Runtime** - WebSocket + HTTP streaming
- **Thread Persistence** - localStorage threadId for session continuity
- **Observability** - 7 lifecycle hooks for monitoring

### Agent Layer
- **5 Specialized Agents** - copilotkit-agent, finance, hr, healthcare, wireless
- **Multi-Agent Routing** - Dynamic agent switching based on intent
- **Tool Orchestration** - 20+ backend tools for data access

### MCP Layer (Model Context Protocol)
- **3 Carrier Servers** - Verizon (8001), AT&T (8002), T-Mobile (8003)
- **100% Live Scraping** - No static data, all from carrier websites
- **Smart Caching** - 1-hour TTL to reduce scraping load
- **Storage-Aware Pricing** - Correct pricing per storage variant

### Data Layer
- **4 Domains** - Finance, HR, Healthcare, Wireless
- **SQLite Database** - 12 tables with realistic mock data
- **FAISS Vector Store** - For RAG document retrieval
- **In-Memory Cache** - Fast device/plan lookup

## Data Flow Summary

1. **User Input** → React UI (CopilotChat/Sidebar/Popup)
2. **Frontend** → CopilotKit Provider (with context + actions)
3. **Transport** → CopilotKit Runtime API (/api/copilotkit)
4. **Backend** → LangGraph Agent (intent classification)
5. **Data Sources**:
   - **Database Tools** → SQLite (Finance, HR, Healthcare, Wireless)
   - **MCP Servers** → Live carrier websites (Verizon, AT&T, T-Mobile)
   - **RAG Tool** → FAISS vector search
6. **Agent** → Calls appropriate tools/MCPs
7. **Response** → Agent calls frontend actions (render UI)
8. **UI Update** → React components render results

## Performance & Caching

- **MCP Cache**: 1-hour TTL per device/plan/storage combo
- **Parallel Scraping**: All 3 carriers scraped simultaneously for comparisons
- **Fallback Strategy**: Minimal hardcoded data ONLY if scraping fails
- **Cache Clearing**: `POST /cache/clear` endpoint on each MCP server

## Security & Best Practices

- **CORS**: Configured for localhost:3000 frontend
- **Rate Limiting**: Playwright headless mode with delays
- **Error Handling**: Graceful fallback for scraping failures
- **Type Safety**: TypeScript + Pydantic for full stack typing
- **No Secrets in Code**: Environment variables for API keys
