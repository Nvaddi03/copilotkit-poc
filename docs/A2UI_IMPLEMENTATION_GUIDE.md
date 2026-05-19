# A2UI Implementation Guide - L4 Declarative Generative UI

**Date:** May 19, 2026  
**Purpose:** Step-by-step guide to implement Google A2UI specification in the POC  
**Status:** 🚧 IMPLEMENTATION GUIDE - Ready to Execute  
**Estimated Time:** 2-3 days  
**Priority:** 🔴 HIGH VALUE

---

## 🎯 What We're Building

Transform the POC from **Controlled GenUI (L3)** to **Declarative GenUI (L4)** using the A2UI specification:

**Before (L3 - Current):**
```typescript
// Each UI component needs a separate action
useCopilotAction({ name: "showPieChart", ... });
useCopilotAction({ name: "showTable", ... });
useCopilotAction({ name: "showMetric", ... });
```

**After (L4 - A2UI):**
```typescript
// Agent composes dashboards from a catalog
User: "Build a sales dashboard"
Agent generates:
[
  {id: "row1", component: "Row", children: ["metric1", "metric2"]},
  {id: "metric1", component: "Metric", label: "Revenue", value: "$1.2M"},
  {id: "metric2", component: "Metric", label: "Customers", value: "3842"},
  {id: "chart1", component: "PieChart", data: [...]}
]
```

**Key Benefits:**
- ✅ **Agent autonomy** - Composes layouts dynamically
- ✅ **Reusable components** - Define once, use everywhere
- ✅ **Cross-platform** - Same catalog works on web, mobile, Slack
- ✅ **Less frontend code** - 20 components power infinite layouts

---

## 📋 Prerequisites

### Install A2UI Dependencies

```bash
cd frontend
npm install @copilotkit/a2ui-renderer recharts zod
```

### Backend Dependencies (Should already have)

```bash
cd backend
pip install copilotkit>=0.1.89
```

---

## 🏗️ Implementation Steps

### Phase 1: Component Catalog (Day 1 - 8 hours)

#### Step 1.1: Create Component Definitions (4 hours)

Create `frontend/src/catalog/definitions.ts`:

```typescript
import { z } from "zod";

/**
 * A2UI Component Catalog Definitions
 * Platform-agnostic contracts for UI building blocks
 */
export const carrierCatalogDefinitions = {
  // ─── Layout Components ───────────────────────────────────
  
  Row: {
    description: "Horizontal layout container with gap control",
    props: z.object({
      gap: z.number().optional().default(16),
      align: z.enum(["start", "center", "end", "stretch"]).optional(),
      justify: z.enum(["start", "center", "end", "spaceBetween"]).optional(),
      children: z.union([
        z.array(z.string()),
        z.object({ componentId: z.string(), path: z.string() }),
      ]),
    }),
  },

  Column: {
    description: "Vertical layout container with gap control",
    props: z.object({
      gap: z.number().optional().default(12),
      align: z.enum(["start", "center", "end", "stretch"]).optional(),
      children: z.union([
        z.array(z.string()),
        z.object({ componentId: z.string(), path: z.string() }),
      ]),
    }),
  },

  // ─── Container Components ───────────────────────────────
  
  Card: {
    description: "Generic card container with optional child slot",
    props: z.object({
      child: z.string().optional(),
    }),
  },

  DashboardCard: {
    description: "Card with title, subtitle, and child content slot",
    props: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      child: z.string().optional(),
    }),
  },

  // ─── Data Display Components ────────────────────────────
  
  Metric: {
    description: "KPI display with label, value, and optional trend indicator",
    props: z.object({
      label: z.string(),
      value: z.string(),
      trend: z.enum(["up", "down", "neutral"]).optional(),
      trendValue: z.string().optional(),
    }),
  },

  Text: {
    description: "Text element with variant control",
    props: z.object({
      text: z.union([z.string(), z.object({ path: z.string() })]),
      variant: z.enum(["h1", "h2", "h3", "body", "caption"]).optional(),
    }),
  },

  Title: {
    description: "Heading element for sections and pages",
    props: z.object({
      text: z.string(),
      level: z.enum(["h1", "h2", "h3"]).optional().default("h2"),
    }),
  },

  // ─── Chart Components ───────────────────────────────────
  
  PieChart: {
    description: "Pie/donut chart with data array",
    props: z.object({
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
          color: z.string().optional(),
        })
      ),
      innerRadius: z.number().optional().default(40),
    }),
  },

  BarChart: {
    description: "Bar chart with data array",
    props: z.object({
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
        })
      ),
      color: z.string().optional().default("#3b82f6"),
    }),
  },

  // ─── Interactive Components ─────────────────────────────
  
  Badge: {
    description: "Small status badge/tag for labels and statuses",
    props: z.object({
      text: z.string(),
      variant: z
        .enum(["success", "warning", "error", "info", "neutral"])
        .optional()
        .default("neutral"),
    }),
  },

  Button: {
    description: "Interactive button with optional action dispatch",
    props: z.object({
      label: z.string().optional(),
      child: z.string().optional(),
      variant: z.enum(["primary", "secondary", "ghost"]).optional(),
      action: z
        .union([
          z.object({
            event: z.object({
              name: z.string(),
              context: z.record(z.any()).optional(),
            }),
          }),
          z.null(),
        ])
        .optional(),
    }),
  },

  // ─── Data Table Components ──────────────────────────────
  
  DataTable: {
    description: "Data table with columns and rows",
    props: z.object({
      columns: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
        })
      ),
      rows: z.array(z.record(z.any())),
    }),
  },

  List: {
    description: "List of children with direction and gap control",
    props: z.object({
      children: z.union([
        z.array(z.string()),
        z.object({ componentId: z.string(), path: z.string() }),
      ]),
      direction: z.enum(["horizontal", "vertical"]).optional(),
      gap: z.number().optional(),
    }),
  },

  // ─── Structure Components ───────────────────────────────
  
  Divider: {
    description: "Horizontal divider line",
    props: z.object({}),
  },

  Tabs: {
    description: "Tabbed container with multiple panels",
    props: z.object({
      tabs: z.array(
        z.object({
          label: z.string(),
          child: z.string(),
        })
      ),
    }),
  },

  // ─── Carrier-Specific Components ────────────────────────
  
  PricingCard: {
    description: "Display device pricing with carrier logo and features",
    props: z.object({
      deviceName: z.string(),
      price: z.string(),
      fullPrice: z.string().optional(),
      carrier: z.enum(["verizon", "att", "tmobile"]),
      features: z.array(z.string()),
      link: z.string().optional(),
    }),
  },

  ComparisonTable: {
    description: "Side-by-side carrier pricing comparison table",
    props: z.object({
      devices: z.array(
        z.object({
          name: z.string(),
          prices: z.record(z.string()),
        })
      ),
    }),
  },
};

/** Type helper for renderers */
export type CarrierCatalogDefinitions = typeof carrierCatalogDefinitions;
```

#### Step 1.2: Create Component Renderers (4 hours)

Create `frontend/src/catalog/renderers.tsx`:

```typescript
import React from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  createCatalog,
  type CatalogRenderers,
} from "@copilotkit/a2ui-renderer";
import {
  carrierCatalogDefinitions,
  type CarrierCatalogDefinitions,
} from "./definitions";

// ─── Helper Functions ────────────────────────────────────────

function resolveText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "path" in value)
    return String((value as { path: string }).path);
  return String(value ?? "");
}

// ─── Component Renderers ─────────────────────────────────────

const carrierCatalogRenderers: CatalogRenderers<CarrierCatalogDefinitions> = {
  // ─── Layout Components ───────────────────────────────────

  Row: ({ props, children }) => {
    const justifyMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      spaceBetween: "space-between",
    };
    const items = Array.isArray(props.children) ? props.children : [];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: `${props.gap ?? 16}px`,
          alignItems: props.align ?? "stretch",
          justifyContent: justifyMap[props.justify ?? "start"] ?? "flex-start",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {items.map((item: any, i: number) => {
          if (typeof item === "string")
            return (
              <div key={`${item}-${i}`} style={{ flex: "1 1 0", minWidth: 0 }}>
                {children(item)}
              </div>
            );
          if (item && typeof item === "object" && "id" in item)
            return (
              <div key={`${item.id}-${i}`} style={{ flex: "1 1 0", minWidth: 0 }}>
                {(children as any)(item.id, item.basePath)}
              </div>
            );
          return null;
        })}
      </div>
    );
  },

  Column: ({ props, children }) => {
    const items = Array.isArray(props.children) ? props.children : [];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${props.gap ?? 12}px`,
          width: "100%",
        }}
      >
        {items.map((item: any, i: number) => {
          if (typeof item === "string")
            return <React.Fragment key={`${item}-${i}`}>{children(item)}</React.Fragment>;
          if (item && typeof item === "object" && "id" in item)
            return (
              <React.Fragment key={`${item.id}-${i}`}>
                {(children as any)(item.id, item.basePath)}
              </React.Fragment>
            );
          return null;
        })}
      </div>
    );
  },

  // ─── Container Components ───────────────────────────────

  Card: ({ props, children }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {typeof props.child === "string" && children(props.child)}
    </div>
  ),

  DashboardCard: ({ props, children }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
          {resolveText(props.title)}
        </div>
        {props.subtitle && (
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
            {resolveText(props.subtitle)}
          </div>
        )}
      </div>
      {typeof props.child === "string" && children(props.child)}
    </div>
  ),

  // ─── Data Display Components ────────────────────────────

  Metric: ({ props }) => {
    const trendColors: Record<string, string> = {
      up: "#059669",
      down: "#dc2626",
      neutral: "#6b7280",
    };
    const trendIcons: Record<string, string> = {
      up: "↑",
      down: "↓",
      neutral: "→",
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: "#6b7280",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {resolveText(props.label)}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
            }}
          >
            {resolveText(props.value)}
          </span>
          {props.trend && props.trendValue && (
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: trendColors[props.trend] ?? "#6b7280",
              }}
            >
              {trendIcons[props.trend]} {resolveText(props.trendValue)}
            </span>
          )}
        </div>
      </div>
    );
  },

  Text: ({ props }) => {
    const styles: Record<string, React.CSSProperties> = {
      h1: { fontSize: "1.5rem", fontWeight: 700, color: "#111827" },
      h2: { fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
      h3: { fontSize: "1rem", fontWeight: 600, color: "#374151" },
      body: { fontSize: "0.875rem", color: "#374151" },
      caption: { fontSize: "0.75rem", color: "#6b7280" },
    };
    return (
      <span style={styles[props.variant ?? "body"]}>
        {resolveText(props.text)}
      </span>
    );
  },

  Title: ({ props }) => {
    const Tag = (props.level === "h1" ? "h1" : props.level === "h3" ? "h3" : "h2") as
      | "h1"
      | "h2"
      | "h3";
    const sizes: Record<string, string> = {
      h1: "1.75rem",
      h2: "1.25rem",
      h3: "1rem",
    };
    return (
      <Tag
        style={{
          margin: 0,
          fontWeight: 600,
          fontSize: sizes[props.level ?? "h2"],
          color: "#111827",
          letterSpacing: "-0.01em",
        }}
      >
        {resolveText(props.text)}
      </Tag>
    );
  },

  // ─── Chart Components ───────────────────────────────────

  PieChart: ({ props }) => {
    const COLORS = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#6366f1",
    ];
    const data = props.data ?? [];
    return (
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <RechartsPie>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={props.innerRadius ?? 40}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPie>
        </ResponsiveContainer>
      </div>
    );
  },

  BarChart: ({ props }) => {
    const data = props.data ?? [];
    return (
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <RechartsBar data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip />
            <Bar
              dataKey="value"
              fill={props.color ?? "#3b82f6"}
              radius={[4, 4, 0, 0]}
            />
          </RechartsBar>
        </ResponsiveContainer>
      </div>
    );
  },

  // ─── Interactive Components ─────────────────────────────

  Badge: ({ props }) => {
    const variants: Record<string, { bg: string; color: string }> = {
      success: { bg: "#dcfce7", color: "#166534" },
      warning: { bg: "#fef3c7", color: "#92400e" },
      error: { bg: "#fee2e2", color: "#991b1b" },
      info: { bg: "#dbeafe", color: "#1e40af" },
      neutral: { bg: "#f3f4f6", color: "#374151" },
    };
    const v = variants[props.variant ?? "neutral"] ?? variants.neutral;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 9999,
          fontSize: "0.7rem",
          fontWeight: 500,
          background: v.bg,
          color: v.color,
        }}
      >
        {resolveText(props.text)}
      </span>
    );
  },

  Button: ({ props, children, dispatch }) => {
    const variants: Record<string, React.CSSProperties> = {
      primary: { background: "#111827", color: "#fff", border: "none" },
      secondary: {
        background: "#fff",
        color: "#374151",
        border: "1px solid #d1d5db",
      },
      ghost: { background: "transparent", color: "#3b82f6", border: "none" },
    };
    const style = variants[props.variant ?? "primary"] ?? variants.primary;
    return (
      <button
        style={{
          ...style,
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: "0.8rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "opacity 0.15s",
          width: "100%",
        }}
        onClick={() => dispatch?.(props.action)}
      >
        {typeof props.child === "string"
          ? children(props.child)
          : props.label ?? null}
      </button>
    );
  },

  // ─── Data Table Components ──────────────────────────────

  DataTable: ({ props }) => {
    const cols = props.columns ?? [];
    const rows = props.rows ?? [];
    return (
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8rem",
          }}
        >
          <thead>
            <tr>
              {cols.map((col: any) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "2px solid #e5e7eb",
                    color: "#6b7280",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                {cols.map((col: any) => (
                  <td
                    key={col.key}
                    style={{ padding: "8px 12px", color: "#374151" }}
                  >
                    {String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  List: ({ props, children }) => {
    const items = Array.isArray(props.children) ? props.children : [];
    const isHorizontal = (props as any).direction === "horizontal";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          gap: props.gap ?? 8,
          overflowX: isHorizontal ? "auto" : undefined,
          flexWrap: isHorizontal ? "nowrap" : undefined,
        }}
      >
        {items.map((item: any, i: number) => {
          if (typeof item === "string")
            return (
              <React.Fragment key={`${item}-${i}`}>
                {children(item)}
              </React.Fragment>
            );
          if (item && typeof item === "object" && "id" in item)
            return (
              <div
                key={`${item.id}-${i}`}
                style={isHorizontal ? { flex: "0 0 auto", minWidth: 280 } : undefined}
              >
                {(children as any)(item.id, item.basePath)}
              </div>
            );
          return null;
        })}
      </div>
    );
  },

  // ─── Structure Components ───────────────────────────────

  Divider: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #e5e7eb",
        margin: "4px 0",
      }}
    />
  ),

  Tabs: ({ props, children }) => {
    const [active, setActive] = React.useState(0);
    const tabs = props.tabs ?? [];
    return (
      <div>
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {tabs.map((tab: any, i: number) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: active === i ? 600 : 400,
                color: active === i ? "#111827" : "#6b7280",
                borderBottom:
                  active === i
                    ? "2px solid #111827"
                    : "2px solid transparent",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 0" }}>
          {tabs[active] && children(tabs[active].child)}
        </div>
      </div>
    );
  },

  // ─── Carrier-Specific Components ────────────────────────

  PricingCard: ({ props }) => {
    const carrierLogos = {
      verizon: "/logos/verizon.png",
      att: "/logos/att.png",
      tmobile: "/logos/tmobile.png",
    };
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <img
          src={carrierLogos[props.carrier]}
          alt={props.carrier}
          style={{ height: 32, marginBottom: 12 }}
        />
        <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>
          {props.deviceName}
        </h3>
        <p
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#111827",
            margin: "8px 0",
          }}
        >
          {props.price}
        </p>
        {props.fullPrice && (
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "4px 0" }}>
            or {props.fullPrice} full price
          </p>
        )}
        <ul style={{ margin: "12px 0", padding: "0 0 0 20px", fontSize: "0.875rem" }}>
          {props.features.map((f, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {f}
            </li>
          ))}
        </ul>
        {props.link && (
          <a
            href={props.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 12,
              color: "#3b82f6",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            View on {props.carrier} →
          </a>
        )}
      </div>
    );
  },

  ComparisonTable: ({ props }) => {
    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                Device
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 12px",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                Verizon
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 12px",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                AT&T
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 12px",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                T-Mobile
              </th>
            </tr>
          </thead>
          <tbody>
            {props.devices.map((device, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                  {device.name}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  {device.prices.verizon || "-"}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  {device.prices.att || "-"}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  {device.prices.tmobile || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

// ─── Assembled Catalog ───────────────────────────────────────

export const carrierCatalog = createCatalog(
  carrierCatalogDefinitions,
  carrierCatalogRenderers,
  {
    catalogId: "copilotkit://carrier-catalog",
    includeBasicCatalog: false,
  }
);
```

---

### Phase 2: Backend Integration (Day 2 - 4 hours)

#### Step 2.1: Update Backend Agent (2 hours)

Update `backend/agent.py` to include CopilotKit Middleware:

```python
from copilotkit import CopilotKitMiddleware
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langgraph.checkpoint.memory import MemorySaver

# ... existing tools ...

# Create agent with CopilotKitMiddleware
agent_graph = create_agent(
    model=ChatOpenAI(model="gpt-4o-mini", temperature=0),
    tools=[
        # ... existing tools ...
        get_carrier_data,  # Your existing carrier scraping tool
    ],
    middleware=[CopilotKitMiddleware()],  # ← Injects generate_a2ui tool
    checkpointer=MemorySaver(),
    system_prompt=(
        "You are a helpful assistant for carrier comparison and dashboard building.\n\n"
        "Tool guidance:\n"
        "- For device pricing: call get_carrier_data, then use generate_a2ui to visualize\n"
        "- For dashboards: call data tools first, then generate_a2ui to build layout\n"
        "- For carrier comparison: scrape all carriers, then generate_a2ui for comparison table\n\n"
        "IMPORTANT: After calling generate_a2ui, do NOT repeat the data in your text response. "
        "Just confirm what was rendered (e.g., 'I've built a dashboard with 3 metrics and a chart')."
    ),
)
```

#### Step 2.2: Update Runtime Configuration (2 hours)

Update `frontend/app/api/copilotkit/route.ts`:

```typescript
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { carrierCatalog } from "@/catalog/renderers";

const runtime = new CopilotRuntime({
  agents: {
    "copilotkit-agent": new LangGraphHttpAgent({
      url: "http://localhost:8000/api/copilotkit/agents/copilotkit-agent"
    })
  },
  
  // ← Enable A2UI with component catalog
  a2ui: {
    injectA2UITool: true,  // Auto-add generate_a2ui tool
    catalog: carrierCatalog,  // Component registry
  },
});

export const { GET, POST } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
});
```

---

### Phase 3: Frontend Integration (Day 2 - 4 hours)

#### Step 3.1: Update Main Provider (30 minutes)

Update `frontend/app/layout.tsx`:

```typescript
import { CopilotKit } from "@copilotkit/react-core";
import { carrierCatalog } from "@/catalog/renderers";
import "@copilotkit/react-core/styles.css";

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="copilotkit-agent"
          // ← Register A2UI catalog
          a2ui={{ catalog: carrierCatalog }}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

#### Step 3.2: Create Dashboard Demo Page (3.5 hours)

Create `frontend/app/dashboard-builder/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function DashboardBuilderPage() {
  const [dashboardSpecs, setDashboardSpecs] = useState<any[]>([]);

  // Register A2UI action that agent can call
  useCopilotAction({
    name: "renderDashboard",
    description: "Render a dashboard using A2UI component specs",
    parameters: [
      {
        name: "specs",
        type: "object[]",
        description: "Array of A2UI component specifications",
        required: true,
      },
    ],
    handler: async ({ specs }) => {
      setDashboardSpecs(specs);
      return "Dashboard rendered successfully";
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            A2UI Dashboard Builder
          </h1>
          <p className="text-gray-600 mt-2">
            Ask the agent to build custom dashboards using the component catalog
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Example Prompts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Try these prompts:</h2>
            <ul className="space-y-2 text-sm">
              <li className="p-2 bg-blue-50 rounded">
                "Build a carrier comparison dashboard"
              </li>
              <li className="p-2 bg-blue-50 rounded">
                "Show iPhone 17 Pro pricing across all carriers"
              </li>
              <li className="p-2 bg-blue-50 rounded">
                "Create a dashboard with 3 metrics and a pie chart"
              </li>
              <li className="p-2 bg-blue-50 rounded">
                "Compare plan pricing in a table"
              </li>
            </ul>
          </div>

          {/* Dashboard Render Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Dashboard Preview</h2>
            {dashboardSpecs.length > 0 ? (
              <div className="space-y-4">
                {/* Render A2UI specs here */}
                {dashboardSpecs.map((spec, index) => (
                  <div key={index} className="border rounded p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(spec, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                No dashboard yet. Ask the agent to build one!
              </div>
            )}
          </div>
        </div>
      </div>

      <CopilotPopup
        labels={{
          title: "Dashboard Builder",
          initial: "I can build custom dashboards! What would you like to see?",
        }}
        instructions="You are a dashboard building assistant. Use generate_a2ui to create rich dashboards from the component catalog."
      />
    </div>
  );
}
```

---

### Phase 4: Testing & Refinement (Day 3 - 8 hours)

#### Step 4.1: Test Basic Functionality (2 hours)

```bash
# Start backend
cd backend
python main.py

# Start frontend
cd frontend
npm run dev
```

Test prompts:
1. "Build a simple dashboard with 2 metrics"
2. "Show a pie chart of carrier market share"
3. "Create a comparison table"

#### Step 4.2: Debug & Fix Issues (4 hours)

Common issues:
- **Middleware not injecting tool**: Check `CopilotKitMiddleware()` is in agent
- **Catalog not found**: Verify `a2ui={{ catalog }}` in both runtime and provider
- **Component not rendering**: Check renderer function signature matches definition
- **Type errors**: Ensure Zod schemas match component props

#### Step 4.3: Polish & Document (2 hours)

- Add error boundaries
- Add loading states
- Update documentation
- Create demo video

---

## 📊 Success Criteria

✅ Agent can generate A2UI component specs  
✅ Frontend renders components from catalog  
✅ "Build a dashboard" creates 3+ components  
✅ Components styled consistently  
✅ No hardcoded layouts - all agent-driven  

---

## 🎯 Next Steps After Implementation

1. **Add More Components** - Expand catalog to 25+ components
2. **Fixed Schemas** - Create predefined layouts for common use cases
3. **A2UI Composer** - Use visual tool to design schemas
4. **Carrier Integration** - Connect to live MCP scrapers
5. **Dashboard Persistence** - Save/load dashboard configurations

---

## 📚 Resources

- **A2UI Spec**: https://a2ui.org/
- **A2UI Composer**: https://a2ui-editor.ag-ui.com/
- **CopilotKit Docs**: https://docs.copilotkit.ai/
- **L4 Tutorial**: `/CopilotKitTutorials/L4.ipynb`
- **Tutorial Comparison**: `/docs/TUTORIAL_COMPARISON_NOTES.md`

---

**Ready to start?** Begin with Phase 1, Step 1.1 - Create Component Definitions! 🚀
