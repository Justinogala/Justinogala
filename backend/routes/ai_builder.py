"""
AI Builder — AI Product Manager that generates comprehensive project documentation.
Supports project CRUD, section-by-section SSE streaming generation, and export.
"""
import os
import json
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/ai-builder", tags=["AI Builder"])

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

SECTIONS = [
    "build", "architecture", "database", "security", "apis",
    "cloud", "documentation", "code", "roadmap",
    "business_plan", "cost_estimate", "investor_deck"
]

SECTION_LABELS = {
    "build": "Build",
    "architecture": "Architecture",
    "database": "Database",
    "security": "Security",
    "apis": "APIs",
    "cloud": "Cloud",
    "documentation": "Documentation",
    "code": "Code",
    "roadmap": "Roadmap",
    "business_plan": "Business Plan",
    "cost_estimate": "Cost Estimate",
    "investor_deck": "Investor Deck",
}


# ─── Pydantic Models ───

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    app_type: str = Field(default="saas")
    template_id: Optional[str] = None


class UpdateProjectRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class UpdateSectionRequest(BaseModel):
    content: str


# ─── Section Prompt Templates ───

def _build_section_prompt(section: str, title: str, description: str, app_type: str, existing_overview: str = "") -> str:
    """Build a detailed system prompt for each section."""
    context = f"Project: {title}\nType: {app_type}\nDescription: {description}"
    if existing_overview and section != "build":
        context += f"\n\nProject Overview (already generated):\n{existing_overview[:2000]}"

    prompts = {
        "build": f"""You are an expert AI Product Manager, Business Analyst, and UX Strategist. Generate a comprehensive product build plan.

{context}

Generate the following in well-structured Markdown:

## Executive Summary
A 3-4 paragraph executive summary of the product vision, target market, and value proposition.

## Business Objectives
- List 5-8 clear, measurable business objectives

## Target Audience
Describe 3-4 user personas with demographics, pain points, and goals.

## Value Proposition
What makes this product unique? Why would users choose this over alternatives?

## Feature List
### Core Features (P0 — Must Have)
List 8-12 core features with descriptions.

### Growth Features (P1 — Should Have)
List 5-8 growth features.

### Nice-to-Have (P2 — Could Have)
List 5-8 nice-to-have features.

## User Stories
Write 10-15 user stories in format: "As a [persona], I want to [action] so that [benefit]"

## Acceptance Criteria
For the top 5 user stories, define 3-5 acceptance criteria each.

## Non-Functional Requirements
- Performance targets, Scalability needs, Reliability SLA, Accessibility (WCAG 2.1), Browser/device support, i18n

## Success Metrics
Define 5-8 KPIs that will measure product success.

## Competitive Landscape
Brief analysis of 3-5 competitors and how this product differentiates.

## Risk Assessment
List top 5 risks with mitigation strategies.

Be specific, actionable, and professional. Use real-world examples where applicable.""",

        "architecture": f"""You are an expert Solution Architect and Cloud Architect. Generate a comprehensive system architecture design.

{context}

Generate the following in well-structured Markdown:

## High-Level Architecture
Describe the overall system architecture pattern (microservices, monolith, serverless, etc.) and justify the choice.

Include a Mermaid flowchart showing the high-level system components and their connections:

```mermaid
graph TD
    A["Client / Browser"] --> B["Load Balancer"]
    B --> C["API Gateway"]
    C --> D["Auth Service"]
    C --> E["Core Service"]
    E --> F[("Primary DB")]
    E --> G[("Cache")]
```

(Customize the diagram above to match THIS specific project's architecture. IMPORTANT: Always wrap node labels that contain special characters like / : ( ) + in double quotes, e.g. A["My Label (with parens)"])

## Component Diagram
List all major components and their responsibilities:
- Frontend Application(s)
- Backend Service(s)
- Database(s)
- Cache Layer
- Message Queue
- CDN
- Load Balancer
- Authentication Service

## Technology Stack
### Frontend
- Framework recommendation with justification
- State management
- UI component library
- Build tools

### Backend
- Language/framework recommendation
- API design (REST/GraphQL)
- Authentication strategy

### Database
- Primary database with justification
- Cache solution
- Search engine (if needed)

### Infrastructure
- Cloud provider recommendation
- Container orchestration
- CI/CD tools

## Data Flow
Describe the main data flows through the system. Include a Mermaid sequence diagram for the primary user flow:

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    U->>F: Action
    F->>A: API Request
    A->>D: Query
    D-->>A: Result
    A-->>F: Response
    F-->>U: Update UI
```

(Customize to match THIS project's core user flow. IMPORTANT: Always wrap node labels in double quotes if they contain special characters.)

## Service Interactions
Define how services communicate (REST, gRPC, message queues, events).

## Infrastructure Design
- Cloud architecture (regions, availability zones)
- Auto-scaling strategy
- CDN configuration
- DNS and domain management

## Scalability Design
- Horizontal scaling approach
- Database sharding strategy (if needed)
- Caching strategy
- Rate limiting

Provide specific technology recommendations with justifications. IMPORTANT: Include Mermaid diagrams using triple-backtick mermaid code blocks. Always use double-quoted labels for any text containing special characters like / : ( ) + e.g. A["My Service (v2)"] or DB[("PostgreSQL / Primary")].""",

        "database": f"""You are an expert Database Architect. Generate a comprehensive database design.

{context}

Generate the following in well-structured Markdown:

## Database Selection
Recommend primary database(s) with justification (PostgreSQL, MongoDB, DynamoDB, etc.)

## Entity Relationship Diagram
Describe all entities, their attributes, and relationships in detail.

Include a Mermaid ER diagram showing the core entities and their relationships:

```mermaid
erDiagram
    USERS ||--o{{ ORDERS : places
    USERS {{
        string id PK
        string email
        string name
    }}
    ORDERS ||--|{{ ORDER_ITEMS : contains
    ORDERS {{
        string id PK
        string user_id FK
        date created_at
    }}
```

(Customize the ER diagram above to match THIS project's actual data model with all core entities.)

## Database Schema
For each major entity, provide:
```
Table/Collection: [name]
- field_name: type, constraints, description
- ...
Indexes: [list indexes]
```

Define at least 8-12 core tables/collections.

## Relationships
Document all relationships:
- One-to-one
- One-to-many
- Many-to-many (with junction tables)

## Indexes
Define indexes for performance:
- Primary indexes
- Secondary indexes
- Composite indexes
- Full-text search indexes

## Data Retention Policies
- Active data retention period
- Archive strategy
- Data purging schedule
- Compliance-driven retention requirements

## Backup Strategy
- Backup frequency
- Backup types (full, incremental, differential)
- Recovery Point Objective (RPO)
- Recovery Time Objective (RTO)
- Backup storage location
- Backup testing schedule

## Migration Strategy
- Schema migration approach
- Data migration plan
- Rollback procedures

Be specific with field types, constraints, and index definitions. IMPORTANT: Include Mermaid erDiagram using triple-backtick mermaid code blocks. Always use double-quoted labels for text with special characters.""",

        "security": f"""You are an expert Security Architect. Generate a comprehensive security design.

{context}

Generate the following in well-structured Markdown:

## Authentication
- Authentication strategy (JWT, OAuth 2.0, SAML)
- Session management
- Password policies
- Social login integration

## Authorization
- Authorization model (RBAC, ABAC, or hybrid)
- Role definitions with permissions matrix
- Resource-level access control

## Multi-Factor Authentication (MFA)
- MFA methods supported (TOTP, SMS, Email, WebAuthn)
- MFA enrollment flow
- Recovery procedures

## Encryption
### At Rest
- Database encryption
- File storage encryption
- Key management strategy (AWS KMS, HashiCorp Vault)

### In Transit
- TLS configuration
- Certificate management
- API security headers

## Audit Logging
- Events to log (auth, data access, admin actions)
- Log storage and retention
- Log analysis and alerting
- SIEM integration

## Compliance
- GDPR compliance measures
- SOC 2 compliance framework
- HIPAA compliance (if applicable)
- PCI DSS compliance (if handling payments)

## Data Privacy
- Data classification (public, internal, confidential, restricted)
- PII handling procedures
- Data anonymization/pseudonymization
- Right to erasure implementation
- Cookie consent management

## Vulnerability Management
- Security scanning (SAST, DAST)
- Dependency vulnerability monitoring
- Penetration testing schedule
- Bug bounty program

## Incident Response
- Incident classification
- Response procedures
- Communication plan
- Post-incident review process

Be specific and actionable with security recommendations.""",

        "apis": f"""You are an expert API Architect. Generate a comprehensive API design.

{context}

Generate the following in well-structured Markdown:

## API Architecture
- REST API design principles
- API versioning strategy
- Base URL structure
- Authentication method for APIs

## Core API Endpoints
For each major resource, define:
```
METHOD /api/v1/resource
Description: ...
Auth: Required/Public
Request Body: {{ ... }}
Response: {{ ... }}
Status Codes: 200, 400, 401, 403, 404
```

Define at least 15-20 core endpoints covering CRUD operations for all major entities.

## GraphQL API (if applicable)
- Schema types
- Queries
- Mutations
- Subscriptions

## Webhooks
- Available webhook events
- Payload format
- Retry strategy
- Webhook management API

## Integration Architecture
- Third-party API integrations needed
- Integration patterns (sync, async, event-driven)
- API gateway configuration

Include a Mermaid sequence diagram showing a key API integration flow:

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant API as Core API
    participant DB as Database
    C->>GW: POST /api/v1/resource
    GW->>Auth: Validate Token
    Auth-->>GW: Valid
    GW->>API: Forward Request
    API->>DB: Create Record
    DB-->>API: Created
    API-->>GW: 201 Created
    GW-->>C: Response
```

(Customize this sequence diagram for THIS project's primary API flow. IMPORTANT: Always use double-quoted labels for text with special characters.)

## Rate Limiting
- Rate limit tiers
- Rate limit headers
- Throttling strategy

## API Documentation
- OpenAPI/Swagger specification outline
- Authentication guide
- Quick start guide
- SDK recommendations

## Error Handling
- Standard error response format
- Error codes catalog
- Retry recommendations

Be specific with request/response formats and status codes. IMPORTANT: Include Mermaid sequence diagrams using triple-backtick mermaid code blocks. Always use double-quoted labels for text with special characters.""",

        "documentation": f"""You are an expert Technical Writer. Generate a comprehensive documentation plan.

{context}

Generate the following in well-structured Markdown:

## Product Documentation
- Product overview document outline
- Feature documentation structure
- Release notes template
- Changelog format

## User Documentation
- Getting started guide outline
- User manual structure (10-15 sections)
- FAQ template (15-20 questions)
- Troubleshooting guide outline

## Admin Documentation
- Installation guide
- Configuration guide
- User management guide
- System monitoring guide
- Backup and recovery guide

## API Documentation
- API reference structure
- Authentication guide
- Quick start tutorial
- Code examples (3 languages)
- Webhook integration guide

## Security Documentation
- Security whitepaper outline
- Data processing agreement
- Vulnerability disclosure policy

## Legal Documents
### Privacy Policy
Outline key sections for the privacy policy.

### Terms of Service
Outline key sections for the ToS.

### Acceptable Use Policy
Outline key sections for the AUP.

Provide detailed outlines with section descriptions.""",

        "roadmap": f"""You are an expert Product Manager. Generate a comprehensive product roadmap and project plan.

{context}

Generate the following in well-structured Markdown:

## Product Roadmap
### Phase 1: MVP (Weeks 1-6)
- Core features to build
- Key milestones
- Success criteria

### Phase 2: Growth (Weeks 7-14)
- Feature expansion
- Integration additions
- Performance optimization

### Phase 3: Scale (Weeks 15-24)
- Enterprise features
- Advanced capabilities
- Market expansion

## Sprint Plan
Plan 6 sprints (2 weeks each) with:
- Sprint goal
- User stories included
- Story points estimate
- Dependencies

## Resource Estimate
- Team composition needed
- Skillsets required
- FTE estimate per role

## Timeline
- Key milestones with dates
- Dependencies between milestones
- Critical path

Include a Mermaid Gantt chart visualizing the roadmap timeline:

```mermaid
gantt
    title Product Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 - MVP
    Core Features           :a1, 2026-01-01, 6w
    Auth & Security         :a2, after a1, 2w
    section Phase 2 - Growth
    Feature Expansion       :b1, after a2, 4w
    Integrations            :b2, after b1, 3w
    section Phase 3 - Scale
    Enterprise Features     :c1, after b2, 5w
    Performance Optimization:c2, after c1, 3w
```

(Customize the Gantt chart above with THIS project's actual phases, features, and realistic timelines.)

## Risk Analysis
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
List 8-10 project risks.

## Cost Estimate
- Development costs
- Infrastructure costs (monthly)
- Third-party service costs
- Total first-year cost estimate

## AI Recommendations
### Monetization Strategies
- Pricing model recommendations
- Revenue projections

### Growth Strategies
- User acquisition channels
- Viral growth mechanics
- Partnership opportunities

### Improvement Suggestions
- Features that would add the most value
- Technical improvements for scalability
- Security enhancements to prioritize

Be realistic and specific with timelines and estimates. IMPORTANT: Include Mermaid gantt chart using triple-backtick mermaid code blocks. Always use double-quoted labels for text with special characters.""",

        "code": f"""You are an expert Full-Stack Developer. Generate starter code and architecture for the project.

{context}

Generate the following in well-structured Markdown with code blocks:

## Project Structure
```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   ├── package.json
│   └── ...
├── backend/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   └── ...
└── infrastructure/
    ├── docker/
    ├── kubernetes/
    └── terraform/
```

## Frontend Code

### Main App Component
```jsx
// App.jsx - Main application component
[Generate realistic starter code]
```

### Key Page Component
```jsx
// Dashboard or main feature page
[Generate realistic component code]
```

### API Service
```javascript
// api.js - API client service
[Generate API service code]
```

## Backend Code

### Server Setup
```python
# server.py or app.py
[Generate realistic server setup]
```

### Core Model
```python
# models/[main_entity].py
[Generate data model code]
```

### Core API Route
```python
# routes/[main_resource].py
[Generate CRUD API route code]
```

### Authentication Middleware
```python
# middleware/auth.py
[Generate auth middleware code]
```

## Database Migrations
```sql
-- Initial migration
[Generate SQL migration or MongoDB schema setup]
```

## Environment Configuration
```env
# .env.example
[Generate environment variables template]
```

Generate production-quality, well-commented code with proper error handling.""",

        "cloud": f"""You are an expert DevOps Engineer and Cloud Architect. Generate a comprehensive cloud infrastructure and deployment design.

{context}

Generate the following in well-structured Markdown:

## Cloud Architecture
- Cloud provider recommendation (AWS/GCP/Azure) with justification
- Region and availability zone strategy
- VPC/network architecture
- CDN configuration
- DNS and domain management

## CI/CD Pipeline
### Build Stage
- Build steps, linting, unit tests, code coverage requirements

### Test Stage
- Integration tests, E2E tests, security scanning, performance tests

### Deploy Stage
- Staging → Production deployment flow
- Blue-green / canary deployment strategy
- Rollback procedures

## Infrastructure as Code
### Docker
```dockerfile
# Dockerfile for backend
[Generate Dockerfile]
```

```dockerfile
# Dockerfile for frontend
[Generate Dockerfile]
```

### Docker Compose
```yaml
# docker-compose.yml for local development
[Generate docker-compose]
```

### Kubernetes (Production)
```yaml
# deployment.yaml
[Generate K8s deployment manifest]
```

## Monitoring & Observability
- Application monitoring (metrics, APM tool recommendation)
- Infrastructure monitoring (CPU, memory, disk, network)
- Dashboard design
- Structured logging strategy, log aggregation tool, retention policy

## Alerting
- Alert rules definition, escalation procedures, on-call rotation

## Scalability
- Auto-scaling policies (horizontal + vertical)
- Load balancer configuration
- CDN configuration
- Database scaling strategy

## Disaster Recovery
- Backup strategy (frequency, RPO, RTO)
- Recovery procedures, failover architecture
- Business continuity plan

## Storage Design
- File/object storage architecture
- Document management, backup storage, archival strategy

Provide specific configurations, tool recommendations, and cost-optimized architecture.""",

        "business_plan": f"""You are an expert Business Strategist, MBA consultant, and Startup Advisor. Generate a comprehensive business plan.

{context}

Generate the following in well-structured Markdown:

## Executive Summary
3-4 paragraph executive summary covering the opportunity, solution, market, and business model.

## Problem Statement
- What problem does this solve?
- How big is the problem?
- Who experiences this problem?
- What are the current workarounds?

## Solution
- How does this product solve the problem?
- Key differentiators
- Unique value proposition

## Market Analysis
### Total Addressable Market (TAM)
### Serviceable Addressable Market (SAM)
### Serviceable Obtainable Market (SOM)
Include estimated market sizes with sources/reasoning.

## Competitive Analysis
| Competitor | Strengths | Weaknesses | Our Advantage |
|-----------|-----------|------------|---------------|
Analyze 5-7 competitors.

## Business Model
- Revenue model (subscription, freemium, transaction-based, etc.)
- Pricing tiers with features and prices
- Unit economics (LTV, CAC, LTV:CAC ratio)
- Revenue projections (Year 1, 2, 3)

## Go-to-Market Strategy
- Launch strategy
- Marketing channels (paid, organic, partnerships)
- Sales strategy
- Customer acquisition funnel

## Growth Strategy
- Viral loops and network effects
- Expansion into new markets/segments
- Partnership opportunities
- Internationalization plan

## Team Requirements
- Key roles needed and when to hire
- Org chart for first 12 months
- Advisory board recommendations

## Key Milestones
| Milestone | Timeline | Success Criteria |
|-----------|----------|-----------------|
List 8-10 key milestones for the first 18 months.

## Risk Analysis
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
List 8-10 business risks.

Be specific with numbers, timelines, and actionable strategies.""",

        "cost_estimate": f"""You are an expert Financial Analyst, CTO, and Project Manager. Generate a detailed cost estimate and financial projection.

{context}

Generate the following in well-structured Markdown:

## Development Costs

### Team Composition
| Role | Count | Monthly Cost | Duration | Total |
|------|-------|-------------|----------|-------|
List all required roles with realistic salary/contractor rates.

### Phase Breakdown
#### Phase 1: MVP (Months 1-3)
- Features included, team needed, estimated cost

#### Phase 2: Growth (Months 4-8)
- Features included, team needed, estimated cost

#### Phase 3: Scale (Months 9-12)
- Features included, team needed, estimated cost

### Total Development Cost Summary
| Phase | Duration | Cost |
|-------|----------|------|

## Infrastructure Costs (Monthly)
| Service | Provider | Tier | Monthly Cost |
|---------|----------|------|-------------|
Include: hosting, database, CDN, email, monitoring, CI/CD, domains, SSL, etc.

### Scaling Projections
| Users | Monthly Infra Cost |
|-------|--------------------|
| 100 | $ |
| 1,000 | $ |
| 10,000 | $ |
| 100,000 | $ |

## Third-Party Services
| Service | Purpose | Monthly Cost |
|---------|---------|-------------|
Include: payment processing, analytics, email, SMS, AI APIs, etc.

## Total Cost Summary
| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|

## Revenue Projections
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Users | | | |
| Paying Users | | | |
| MRR | | | |
| ARR | | | |

## Break-Even Analysis
- When does the product break even?
- Key assumptions

## ROI Analysis
- Return on investment timeline
- 3-year projected ROI

Provide realistic, market-rate estimates. Be specific with dollar amounts.""",

        "investor_deck": f"""You are an expert Startup Advisor and VC pitch deck consultant who has helped raise $100M+ in funding. Generate a compelling investor pitch deck content.

{context}

Generate the following in well-structured Markdown — each section represents a slide:

## Slide 1: Title
- Company name, tagline (one sentence), founding date, location

## Slide 2: Problem
- The core problem in 2-3 bullet points
- Market pain points with real statistics
- "Before" scenario showing the frustration

## Slide 3: Solution
- How the product solves the problem
- Key features (3-5 bullet points)
- "After" scenario showing the improvement
- Screenshot/mockup description

## Slide 4: Market Opportunity
- TAM / SAM / SOM with dollar figures
- Market growth rate
- Why now? (market timing)

## Slide 5: Product
- Key features and capabilities
- Technology differentiators
- Product screenshots/demo description
- User testimonials (suggested)

## Slide 6: Business Model
- Revenue model
- Pricing strategy
- Unit economics (LTV, CAC, margins)

## Slide 7: Traction
- Key metrics to highlight (users, revenue, growth rate)
- Milestone timeline
- Customer logos/testimonials (suggested)

## Slide 8: Competitive Landscape
- Market positioning map
- Key differentiators vs top 3-5 competitors
- Moats and defensibility

## Slide 9: Go-to-Market
- Customer acquisition strategy
- Distribution channels
- Partnership strategy
- Sales process

## Slide 10: Team
- Key team members needed with backgrounds
- Advisory board recommendations
- Key hires planned

## Slide 11: Financials
- Revenue projections (3 years)
- Key financial metrics
- Path to profitability
- Burn rate and runway

## Slide 12: The Ask
- Funding amount sought
- Use of funds breakdown (pie chart description)
- Key milestones the funding will achieve
- Expected timeline to next round

## Appendix: Key Assumptions
- List all major assumptions underlying the financial projections
- Sensitivity analysis on key variables

Make the content compelling, data-driven, and investor-ready. Use specific numbers and percentages.""",
    }

    return prompts.get(section, f"Generate comprehensive documentation for the '{section}' section of: {context}")


# ─── API Endpoints ───

@router.post("/projects")
async def create_project(req: CreateProjectRequest, user: dict = Depends(get_current_user)):
    """Create a new AI Builder project."""
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    sections = {}
    for s in SECTIONS:
        sections[s] = {"content": "", "status": "pending", "generated_at": None}

    project = {
        "id": project_id,
        "user_id": user["id"],
        "title": req.title,
        "description": req.description,
        "app_type": req.app_type,
        "sections": sections,
        "share_token": None,
        "clarify_answers": [],
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }

    await db.ai_builder_projects.insert_one(project)
    project.pop("_id", None)
    return project


@router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    """List all projects for the current user."""
    cursor = db.ai_builder_projects.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("updated_at", -1)
    projects = await cursor.to_list(100)

    # Return lightweight list (without full section content)
    result = []
    for p in projects:
        section_status = {}
        for s in SECTIONS:
            sec = p.get("sections", {}).get(s, {})
            section_status[s] = sec.get("status", "pending")
        result.append({
            "id": p["id"],
            "title": p["title"],
            "description": p["description"][:200],
            "app_type": p.get("app_type", "saas"),
            "section_status": section_status,
            "created_at": p["created_at"],
            "updated_at": p["updated_at"],
        })
    return result


@router.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    """Get full project details."""
    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.put("/projects/{project_id}")
async def update_project(project_id: str, req: UpdateProjectRequest, user: dict = Depends(get_current_user)):
    """Update project title/description."""
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if req.title:
        update["title"] = req.title
    if req.description:
        update["description"] = req.description

    result = await db.ai_builder_projects.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return {"success": True}


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    """Delete a project."""
    result = await db.ai_builder_projects.delete_one(
        {"id": project_id, "user_id": user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Project not found")
    return {"success": True}


@router.post("/projects/{project_id}/generate/{section}")
async def generate_section(project_id: str, section: str, user: dict = Depends(get_current_user)):
    """Generate content for a specific section using SSE streaming."""
    if section not in SECTIONS:
        raise HTTPException(400, f"Invalid section: {section}. Valid: {', '.join(SECTIONS)}")

    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    # Get existing build/overview for context
    existing_overview = ""
    if section != "build":
        build_sec = project.get("sections", {}).get("build", {})
        if build_sec.get("status") == "done":
            existing_overview = build_sec.get("content", "")

    # Mark as generating
    await db.ai_builder_projects.update_one(
        {"id": project_id},
        {"$set": {
            f"sections.{section}.status": "generating",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    prompt = _build_section_prompt(
        section, project["title"], project["description"],
        project.get("app_type", "saas"), existing_overview
    )

    async def stream():
        from llm_client import chat_completion
        full_content = ""
        try:
            yield f"data: {json.dumps({'type': 'start', 'section': section})}\n\n"

            response = await asyncio.to_thread(
                chat_completion,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Generate the {SECTION_LABELS.get(section, section)} section now. Be comprehensive and specific."}
                ],
                model="gpt-5.2",
                api_key=EMERGENT_KEY,
                stream=True,
                max_tokens=4000,
            )

            for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    full_content += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content})}\n\n"
                # Keepalive
                await asyncio.sleep(0)

            # Save generated content (with version history)
            now = datetime.now(timezone.utc).isoformat()
            existing_content = project.get("sections", {}).get(section, {}).get("content", "")
            history_entry = None
            if existing_content:
                history_entry = {
                    "content": existing_content,
                    "generated_at": project.get("sections", {}).get(section, {}).get("generated_at"),
                    "replaced_at": now,
                }

            update_set = {
                f"sections.{section}.content": full_content,
                f"sections.{section}.status": "done",
                f"sections.{section}.generated_at": now,
                "updated_at": now,
            }
            update_ops = {"$set": update_set}
            if history_entry:
                update_ops["$push"] = {f"sections.{section}.history": history_entry}

            await db.ai_builder_projects.update_one(
                {"id": project_id}, update_ops
            )

            yield f"data: {json.dumps({'type': 'done', 'section': section})}\n\n"

        except Exception as e:
            logger.error(f"AI Builder generation error ({section}): {e}")
            err_msg = str(e)
            if "budget" in err_msg.lower() or "balance" in err_msg.lower():
                error_content = "AI service unavailable due to usage limits. Please contact your administrator."
            else:
                error_content = f"Generation failed: {err_msg[:200]}"

            await db.ai_builder_projects.update_one(
                {"id": project_id},
                {"$set": {
                    f"sections.{section}.status": "error",
                    f"sections.{section}.content": error_content,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            yield f"data: {json.dumps({'type': 'error', 'message': error_content})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.put("/projects/{project_id}/sections/{section}")
async def update_section(project_id: str, section: str, req: UpdateSectionRequest, user: dict = Depends(get_current_user)):
    """Manually update section content."""
    if section not in SECTIONS:
        raise HTTPException(400, f"Invalid section: {section}")

    result = await db.ai_builder_projects.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": {
            f"sections.{section}.content": req.content,
            f"sections.{section}.status": "done",
            f"sections.{section}.generated_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return {"success": True}


@router.post("/projects/{project_id}/generate-all")
async def generate_all_sections(project_id: str, user: dict = Depends(get_current_user)):
    """Trigger generation of all sections (overview first, then rest in sequence)."""
    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    async def stream():
        from llm_client import chat_completion

        build_content = ""

        for section in SECTIONS:
            try:
                yield f"data: {json.dumps({'type': 'section_start', 'section': section})}\n\n"

                # Mark generating
                await db.ai_builder_projects.update_one(
                    {"id": project_id},
                    {"$set": {f"sections.{section}.status": "generating"}}
                )

                prompt = _build_section_prompt(
                    section, project["title"], project["description"],
                    project.get("app_type", "saas"), build_content
                )

                response = await asyncio.to_thread(
                    chat_completion,
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": f"Generate the {SECTION_LABELS.get(section, section)} section now. Be comprehensive and specific."}
                    ],
                    model="gpt-5.2",
                    api_key=EMERGENT_KEY,
                    stream=True,
                    max_tokens=4000,
                )

                full = ""
                for chunk in response:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta and delta.content:
                        full += delta.content
                        yield f"data: {json.dumps({'type': 'chunk', 'section': section, 'content': delta.content})}\n\n"
                    await asyncio.sleep(0)

                if section == "build":
                    build_content = full

                now = datetime.now(timezone.utc).isoformat()
                await db.ai_builder_projects.update_one(
                    {"id": project_id},
                    {"$set": {
                        f"sections.{section}.content": full,
                        f"sections.{section}.status": "done",
                        f"sections.{section}.generated_at": now,
                        "updated_at": now,
                    }}
                )

                yield f"data: {json.dumps({'type': 'section_done', 'section': section})}\n\n"

            except Exception as e:
                logger.error(f"AI Builder generate-all error ({section}): {e}")
                await db.ai_builder_projects.update_one(
                    {"id": project_id},
                    {"$set": {f"sections.{section}.status": "error"}}
                )
                yield f"data: {json.dumps({'type': 'section_error', 'section': section, 'message': str(e)[:200]})}\n\n"

        yield f"data: {json.dumps({'type': 'all_done'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")



# ─── Duplicate Project ───

@router.post("/projects/{project_id}/duplicate")
async def duplicate_project(project_id: str, user: dict = Depends(get_current_user)):
    """Duplicate an existing project."""
    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_project = {
        **project,
        "id": new_id,
        "title": f"{project['title']} (Copy)",
        "created_at": now,
        "updated_at": now,
        "share_token": None,
    }
    new_project.pop("_id", None)
    await db.ai_builder_projects.insert_one(new_project)
    new_project.pop("_id", None)
    return new_project


# ─── Share Project ───

@router.post("/projects/{project_id}/share")
async def create_share_link(project_id: str, user: dict = Depends(get_current_user)):
    """Generate a public share token for read-only access."""
    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    share_token = project.get("share_token")
    if not share_token:
        share_token = str(uuid.uuid4())[:12]
        await db.ai_builder_projects.update_one(
            {"id": project_id},
            {"$set": {"share_token": share_token}}
        )

    return {"share_token": share_token}


@router.delete("/projects/{project_id}/share")
async def revoke_share_link(project_id: str, user: dict = Depends(get_current_user)):
    """Revoke the public share link."""
    result = await db.ai_builder_projects.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": {"share_token": None}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return {"success": True}


@router.get("/shared/{share_token}")
async def get_shared_project(share_token: str):
    """Public endpoint — get project by share token (read-only, no auth)."""
    project = await db.ai_builder_projects.find_one(
        {"share_token": share_token}, {"_id": 0, "user_id": 0}
    )
    if not project:
        raise HTTPException(404, "Shared project not found or link expired")
    return project


# ─── Export Project ───

@router.get("/projects/{project_id}/export/{format}")
async def export_project(project_id: str, format: str, user: dict = Depends(get_current_user)):
    """Export project as Markdown or JSON."""
    if format not in ("md", "json"):
        raise HTTPException(400, "Supported formats: md, json")

    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    if format == "json":
        from fastapi.responses import JSONResponse
        return JSONResponse(content=project, headers={
            "Content-Disposition": f'attachment; filename="{project["title"]}.json"'
        })

    # Markdown export
    md = f"# {project['title']}\n\n"
    md += f"**Type:** {project.get('app_type', 'N/A')}  \n"
    md += f"**Created:** {project.get('created_at', 'N/A')}  \n\n"
    md += f"## Description\n{project.get('description', '')}\n\n"
    md += "---\n\n"

    for section_key in SECTIONS:
        sec = project.get("sections", {}).get(section_key, {})
        label = SECTION_LABELS.get(section_key, section_key)
        content = sec.get("content", "")
        if content:
            md += f"# {label}\n\n{content}\n\n---\n\n"

    from fastapi.responses import Response
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{project["title"]}.md"'}
    )


# ─── AI Clarifying Questions ───

@router.post("/projects/{project_id}/clarify")
async def get_clarifying_questions(project_id: str, user: dict = Depends(get_current_user)):
    """AI generates clarifying questions about the project idea before generation."""
    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    from llm_client import chat_completion

    prompt = f"""You are an expert Product Manager conducting a discovery session. Based on the following product idea, generate 5-8 clarifying questions that would help you create better documentation.

Project: {project['title']}
Type: {project.get('app_type', 'saas')}
Description: {project['description']}

Return ONLY a JSON array of question objects like:
[{{"question": "...", "options": ["Option A", "Option B", "Option C"], "category": "audience|features|tech|monetization|scale"}}]

Focus on questions about:
- Target audience specifics
- Core vs nice-to-have features
- Technology preferences
- Monetization model
- Scale expectations
- Integration needs
- Compliance requirements"""

    try:
        response = await asyncio.to_thread(
            chat_completion,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Generate the clarifying questions as a JSON array."}
            ],
            model="gpt-5.2",
            api_key=EMERGENT_KEY,
            stream=False,
            max_tokens=1500,
        )
        content = response.choices[0].message.content.strip()
        # Try to extract JSON from response
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        questions = json.loads(content)
        return {"questions": questions}
    except Exception as e:
        logger.error(f"Clarify questions error: {e}")
        return {"questions": [
            {"question": "Who is the primary target audience?", "options": ["Consumers", "Small Business", "Enterprise"], "category": "audience"},
            {"question": "What is the monetization model?", "options": ["Freemium", "Subscription", "One-time Purchase", "Usage-based"], "category": "monetization"},
            {"question": "What scale do you expect at launch?", "options": ["< 100 users", "100-1000 users", "1000-10000 users", "10000+ users"], "category": "scale"},
            {"question": "Any specific compliance requirements?", "options": ["GDPR", "HIPAA", "SOC2", "None specific"], "category": "tech"},
        ]}


@router.put("/projects/{project_id}/clarify-answers")
async def save_clarify_answers(project_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Save clarifying question answers and append to project description."""
    body = await request.json()
    answers = body.get("answers", [])

    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    # Append answers to description for richer context
    extra_context = "\n\nAdditional Requirements (from clarifying questions):\n"
    for a in answers:
        extra_context += f"- {a.get('question', '')}: {a.get('answer', '')}\n"

    new_desc = project.get("description", "") + extra_context

    await db.ai_builder_projects.update_one(
        {"id": project_id},
        {"$set": {
            "description": new_desc,
            "clarify_answers": answers,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    return {"success": True}


# ─── Search Within Project ───

@router.get("/projects/{project_id}/search")
async def search_project(project_id: str, q: str = "", user: dict = Depends(get_current_user)):
    """Search across all sections of a project."""
    if not q.strip():
        return {"results": []}

    project = await db.ai_builder_projects.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not project:
        raise HTTPException(404, "Project not found")

    query = q.lower()
    results = []
    for section_key in SECTIONS:
        sec = project.get("sections", {}).get(section_key, {})
        content = sec.get("content", "")
        if not content:
            continue

        lines = content.split("\n")
        for i, line in enumerate(lines):
            if query in line.lower():
                # Get surrounding context
                start = max(0, i - 1)
                end = min(len(lines), i + 2)
                snippet = "\n".join(lines[start:end])
                results.append({
                    "section": section_key,
                    "section_label": SECTION_LABELS.get(section_key, section_key),
                    "line": i + 1,
                    "snippet": snippet[:300],
                })

    return {"results": results, "total": len(results)}


# ─── Project Templates ───

PROJECT_TEMPLATES = [
    {
        "id": "saas-starter",
        "title": "SaaS Starter",
        "description": "A subscription-based SaaS application with user authentication, team management, billing (Stripe), dashboard analytics, and a REST API. Target audience is small-to-medium businesses. Includes freemium pricing model with free, pro, and enterprise tiers.",
        "app_type": "saas",
        "icon": "rocket",
    },
    {
        "id": "ecommerce",
        "title": "E-Commerce Platform",
        "description": "A full-featured online store with product catalog, shopping cart, checkout flow, payment processing (Stripe/PayPal), order management, inventory tracking, customer reviews, and admin dashboard. Supports multiple product categories, search, and filtering.",
        "app_type": "ecommerce",
        "icon": "shopping-cart",
    },
    {
        "id": "marketplace",
        "title": "Two-Sided Marketplace",
        "description": "A platform connecting service providers with customers. Features include provider profiles, service listings, booking/scheduling, messaging, reviews/ratings, payment escrow, commission management, and dispute resolution. Think Fiverr/Upwork model.",
        "app_type": "saas",
        "icon": "users",
    },
    {
        "id": "crm",
        "title": "CRM System",
        "description": "Customer relationship management system with contact management, deal pipeline, email integration, activity tracking, reporting dashboards, task management, and team collaboration. Includes import/export, custom fields, and automation workflows.",
        "app_type": "crm",
        "icon": "contacts",
    },
    {
        "id": "ai-chatbot",
        "title": "AI-Powered Chatbot",
        "description": "An AI chatbot platform with custom knowledge base training, multi-channel deployment (web widget, Slack, Discord, API), conversation analytics, human handoff, intent detection, and admin dashboard. Supports RAG with document upload and vector search.",
        "app_type": "ai",
        "icon": "bot",
    },
    {
        "id": "project-management",
        "title": "Project Management Tool",
        "description": "A project management application with Kanban boards, Gantt charts, sprint planning, time tracking, team workload management, file sharing, commenting, notifications, and reporting. Supports multiple project views and integrations with GitHub/Slack.",
        "app_type": "saas",
        "icon": "layout",
    },
    {
        "id": "healthcare",
        "title": "Healthcare Management",
        "description": "HIPAA-compliant healthcare management system with patient records (EHR), appointment scheduling, telemedicine video calls, prescription management, lab results tracking, insurance billing, and provider portal. Includes audit logging and data encryption.",
        "app_type": "healthcare",
        "icon": "heart",
    },
    {
        "id": "internal-tool",
        "title": "Internal Business Tool",
        "description": "An internal company tool for employee management, leave/time-off requests, expense reporting, asset tracking, IT helpdesk ticketing, company announcements, and document management. Includes RBAC, SSO integration, and audit trails.",
        "app_type": "internal",
        "icon": "building",
    },
]


@router.get("/templates")
async def get_templates():
    """Get available project templates."""
    return {"templates": PROJECT_TEMPLATES}
