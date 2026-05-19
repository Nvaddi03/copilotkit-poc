# CopilotKit POC - System Architecture

## Full System Architecture (Mermaid)

```mermaid
graph TB
    subgraph "Frontend - Next.js 14 (Port 3000)"
        User[👤 User Interface]
        Chat[CopilotChat Component]
        Actions[useCopilotAction Handlers]
        Readable[useCopilotReadable State]
        UI[React UI Components]
    end

    subgraph "CopilotKit Runtime"
        Runtime[/api/copilotkit Endpoint]
        SDK[CopilotKit SDK]
    end

    subgraph "Backend - FastAPI Python"
        Agent[LangGraph Agent]
        Intent[Intent Classifier]
        
        subgraph "Tools Layer"
            DBTool[Database Tools]
            MCPTool[MCP Client Tool]
            RAGTool[RAG/FAISS Tool]
        end
        
        subgraph "Data Sources"
            SQLite[(SQLite DBs<br/>Finance, HR,<br/>Healthcare,<br/>Wireless)]
            FAISS[(FAISS Vector<br/>Database)]
        end
    end

    subgraph "MCP Servers - FastAPI (Ports 8001-8003)"
        V[Verizon MCP<br/>Port 8001]
        A[AT&T MCP<br/>Port 8002]
        T[T-Mobile MCP<br/>Port 8003]
        
        subgraph "Scraping Layer"
            VS[Verizon Scraper<br/>Playwright]
            AS[AT&T Scraper<br/>Playwright]
            TS[T-Mobile Scraper<br/>Playwright]
        end
        
        subgraph "Cache Layer"
            VC[Verizon Cache<br/>1hr TTL]
            AC[AT&T Cache<br/>1hr TTL]
            TC[T-Mobile Cache<br/>1hr TTL]
        end
    end

    subgraph "External - Live Websites"
        VW[verizon.com]
        AW[att.com]
        TW[t-mobile.com]
    end

    User -->|Types Query| Chat
    Chat -->|Sends Message| Runtime
    Runtime -->|Routes to| SDK
    SDK -->|Invokes| Agent
    
    Agent -->|Classifies Intent| Intent
    
    Intent -->|Device/Plan Query| MCPTool
    Intent -->|Database Query| DBTool
    Intent -->|Document Query| RAGTool
    
    DBTool -->|SQL Queries| SQLite
    RAGTool -->|Vector Search| FAISS
    
    MCPTool -->|HTTP Request| V
    MCPTool -->|HTTP Request| A
    MCPTool -->|HTTP Request| T
    
    V -->|Check Cache| VC
    A -->|Check Cache| AC
    T -->|Check Cache| TC
    
    VC -->|Cache Miss| VS
    AC -->|Cache Miss| AS
    TC -->|Cache Miss| TS
    
    VS -->|Scrape Prices| VW
    AS -->|Scrape Prices| AW
    TS -->|Scrape Prices| TW
    
    V -->|Return JSON| MCPTool
    A -->|Return JSON| MCPTool
    T -->|Return JSON| MCPTool
    
    Agent -->|Call Action| Actions
    Agent -->|Stream Response| Chat
    
    Actions -->|Update State| UI
    Readable -->|Read by| Agent
    
    UI -->|Display Results| User

    style User fill:#e1f5ff
    style Chat fill:#fff4e1
    style Agent fill:#ffe1f5
    style V fill:#ffcccb
    style A fill:#cce5ff
    style T fill:#e1ccff
    style VW fill:#ff6b6b
    style AW fill:#4d94ff
    style TW fill:#9d4dff
```

## Simplified Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(Next.js)
    participant R as CopilotKit<br/>Runtime
    participant A as LangGraph<br/>Agent
    participant M as MCP<br/>Server
    participant S as Web<br/>Scraper
    participant W as Carrier<br/>Website

    U->>F: "Compare iPhone 17 Pro prices"
    F->>R: POST /api/copilotkit
    R->>A: Invoke agent with query
    
    A->>A: Classify intent:<br/>"multi-carrier comparison"
    
    par Parallel Scraping
        A->>M: get_device_info(verizon)
        M->>S: Check cache (miss)
        S->>W: Scrape verizon.com
        W-->>S: HTML + Prices
        S-->>M: Device data
        M-->>A: $1099, $30.56/mo
    and
        A->>M: get_device_info(att)
        M->>S: Check cache (miss)
        S->>W: Scrape att.com
        W-->>S: HTML + Prices
        S-->>M: Device data
        M-->>A: $1099.99, $30.56/mo
    and
        A->>M: get_device_info(tmobile)
        M->>S: Check cache (miss)
        S->>W: Scrape t-mobile.com
        W-->>S: HTML + Prices
        S-->>M: Device data
        M-->>A: $1079, $30/mo
    end
    
    A->>A: Aggregate results
    A->>R: renderCarrierComparison(...)
    R->>F: Call useCopilotAction
    F->>F: Update UI state
    F->>U: Display comparison table<br/>🏆 T-Mobile $1079 (Best Price)
```

## MCP Server Architecture

```mermaid
graph LR
    subgraph "MCP Server (FastAPI)"
        Endpoint[/tools/get_device_info]
        Cache{Cache<br/>Check}
        Scraper[Playwright<br/>Scraper]
        Parser[BeautifulSoup<br/>Parser]
    end
    
    Agent[LangGraph Agent] -->|HTTP POST| Endpoint
    Endpoint --> Cache
    Cache -->|Hit| Return1[Return Cached<br/>Data]
    Cache -->|Miss| Scraper
    Scraper -->|Launch Browser| Web[Carrier Website]
    Web -->|HTML| Parser
    Parser -->|Extract Prices| Return2[Return Fresh<br/>Data]
    Return2 --> CacheStore[Update Cache<br/>1hr TTL]
    
    Return1 --> Response[JSON Response]
    Return2 --> Response
    Response --> Agent

    style Cache fill:#fff4cc
    style Scraper fill:#ccf4ff
    style Parser fill:#ccffcc
```

## Multi-Agent Routing

```mermaid
graph TD
    User[User Query]
    Main[Main Agent<br/>copilotkit-agent]
    
    Main --> Finance{Finance<br/>Query?}
    Main --> HR{HR<br/>Query?}
    Main --> Health{Healthcare<br/>Query?}
    Main --> Wireless{Wireless<br/>Query?}
    
    Finance -->|Yes| FA[Finance Agent<br/>Revenue, Expenses]
    HR -->|Yes| HA[HR Agent<br/>Employees, Policies]
    Health -->|Yes| HCA[Healthcare Agent<br/>Patients, Visits]
    Wireless -->|Yes| WA[Wireless Agent<br/>Customers, Plans]
    
    FA --> DB1[(Finance DB)]
    HA --> DB2[(HR DB)]
    HCA --> DB3[(Healthcare DB)]
    WA --> DB4[(Wireless DB)]
    
    Finance -->|No| Main
    HR -->|No| Main
    Health -->|No| Main
    Wireless -->|No| Main
    
    DB1 --> Result[Agent Response]
    DB2 --> Result
    DB3 --> Result
    DB4 --> Result
    
    Result --> UI[Update UI]

    style Main fill:#ffe1cc
    style FA fill:#ccf4e1
    style HA fill:#cce1f4
    style HCA fill:#f4cce1
    style WA fill:#e1ccf4
```

## Cache Strategy

```mermaid
graph TB
    Request[Device Request<br/>iPhone 17 Pro, 256GB]
    
    Key[Generate Cache Key<br/>verizon_iphone-17-pro_256GB]
    
    Check{Cache<br/>Exists?}
    
    Age{Age < 1hr?}
    
    Return1[Return Cached Data<br/>⚡ Fast: ~50ms]
    
    Scrape[Scrape Live Data<br/>🌐 Slow: ~3s]
    
    Store[Store in Cache<br/>TTL: 3600s]
    
    Return2[Return Fresh Data]
    
    Request --> Key
    Key --> Check
    Check -->|Yes| Age
    Check -->|No| Scrape
    Age -->|Yes| Return1
    Age -->|No| Scrape
    Scrape --> Store
    Store --> Return2
    
    Return1 --> Response[JSON Response]
    Return2 --> Response

    style Return1 fill:#ccffcc
    style Scrape fill:#ffcccc
    style Store fill:#ffffcc
```

## Technology Stack

```mermaid
mindmap
    root((CopilotKit<br/>POC))
        Frontend
            Next.js 14
            React 18
            TypeScript
            Tailwind CSS
            CopilotKit SDK
        Backend
            FastAPI
            LangGraph
            LangChain
            Python 3.11
        AI/ML
            OpenAI GPT-4o
            FAISS Vector DB
            Embeddings
        Scraping
            Playwright
            BeautifulSoup4
            Chromium
        Data
            SQLite
            4 Domain DBs
            Vector Store
        MCP
            3 FastAPI Servers
            HTTP/JSON API
            1hr Cache TTL
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer<br/>NGINX]
        
        subgraph "Frontend Cluster"
            FE1[Next.js Instance 1<br/>Port 3000]
            FE2[Next.js Instance 2<br/>Port 3000]
        end
        
        subgraph "Backend Cluster"
            BE1[FastAPI Instance 1<br/>Port 8000]
            BE2[FastAPI Instance 2<br/>Port 8000]
        end
        
        subgraph "MCP Cluster"
            MCP1[Verizon MCP<br/>Port 8001]
            MCP2[AT&T MCP<br/>Port 8002]
            MCP3[T-Mobile MCP<br/>Port 8003]
        end
        
        Redis[(Redis Cache<br/>Shared)]
        PG[(PostgreSQL<br/>Production DB)]
    end
    
    Internet[Internet] --> LB
    LB --> FE1
    LB --> FE2
    
    FE1 --> BE1
    FE1 --> BE2
    FE2 --> BE1
    FE2 --> BE2
    
    BE1 --> MCP1
    BE1 --> MCP2
    BE1 --> MCP3
    BE2 --> MCP1
    BE2 --> MCP2
    BE2 --> MCP3
    
    MCP1 --> Redis
    MCP2 --> Redis
    MCP3 --> Redis
    
    BE1 --> PG
    BE2 --> PG

    style LB fill:#ff9999
    style Redis fill:#99ccff
    style PG fill:#99ff99
```

## Error Handling Flow

```mermaid
graph TD
    Start[User Request]
    Agent[Agent Processing]
    
    Agent --> MCP{MCP<br/>Request}
    
    MCP --> Cache{Check<br/>Cache}
    
    Cache -->|Hit| Success1[Return Cached<br/>Data ✅]
    Cache -->|Miss| Scrape[Initiate<br/>Scraping]
    
    Scrape --> WebReq{Website<br/>Response}
    
    WebReq -->|200 OK| Parse[Parse HTML]
    WebReq -->|4xx/5xx| Retry{Retry<br/>Count < 3?}
    
    Retry -->|Yes| Scrape
    Retry -->|No| Fallback[Use Fallback<br/>Data ⚠️]
    
    Parse --> Valid{Valid<br/>Data?}
    
    Valid -->|Yes| Success2[Cache &<br/>Return ✅]
    Valid -->|No| Fallback
    
    Fallback --> Error[Return Error<br/>Message ❌]
    
    Success1 --> UI[Update UI]
    Success2 --> UI
    Error --> UI

    style Success1 fill:#ccffcc
    style Success2 fill:#ccffcc
    style Error fill:#ffcccc
    style Fallback fill:#ffffcc
```

---

## How to View These Diagrams

### Option 1: VS Code (Recommended)
1. Install extension: **Markdown Preview Mermaid Support**
2. Open this file in VS Code
3. Press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)
4. Diagrams will render in preview pane

### Option 2: GitHub
1. Push this file to GitHub
2. View in GitHub web interface
3. Mermaid diagrams render automatically

### Option 3: Online Editor
1. Copy diagram code
2. Go to https://mermaid.live/
3. Paste and view/export

---

## Key Architecture Highlights

### 1. **Frontend → Backend Communication**
- **Protocol:** HTTP/JSON via CopilotKit Runtime API
- **Transport:** Server-Sent Events (SSE) for streaming
- **State Management:** React Context + useCopilotAction hooks

### 2. **Agent → MCP Communication**
- **Protocol:** HTTP POST with JSON payloads
- **Endpoints:** `/tools/get_device_info`, `/tools/get_plans`
- **Error Handling:** Retry logic + fallback data

### 3. **MCP → Website Scraping**
- **Tool:** Playwright (headless Chromium)
- **Parser:** BeautifulSoup4 for HTML extraction
- **Caching:** In-memory cache with 1-hour TTL

### 4. **Multi-Agent Routing**
- **Main Agent:** Routes queries to specialized agents
- **Domain Agents:** Finance, HR, Healthcare, Wireless
- **Context Preservation:** Thread history maintained

### 5. **Cache Strategy**
- **TTL:** 1 hour (3600 seconds)
- **Invalidation:** Manual via `/cache/clear` endpoint
- **Hit Rate:** ~80% in typical usage

---

**Last Updated:** May 19, 2026  
**Version:** 2.0
