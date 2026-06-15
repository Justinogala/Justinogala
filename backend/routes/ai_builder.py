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
    "overview", "requirements", "architecture", "database",
    "security", "apis", "documentation", "roadmap", "code", "deployment"
]

SECTION_LABELS = {
    "overview": "Overview",
    "requirements": "Requirements",
    "architecture": "Architecture",
    "database": "Database",
    "security": "Security",
    "apis": "APIs",
    "documentation": "Documentation",
    "roadmap": "Roadmap",
    "code": "Code",
    "deployment": "Deployment",
}


# ─── Pydantic Models ───

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    app_type: str = Field(default="saas")


class UpdateProjectRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class UpdateSectionRequest(BaseModel):
    content: str


# ─── Section Prompt Templates ───

def _build_section_prompt(section: str, title: str, description: str, app_type: str, existing_overview: str = "") -> str:
    """Build a detailed system prompt for each section."""
    context = f"Project: {title}\nType: {app_type}\nDescription: {description}"
    if existing_overview and section != "overview":
        context += f"\n\nProject Overview (already generated):\n{existing_overview[:2000]}"

    prompts = {
        "overview": f"""You are an expert AI Product Manager and Business Analyst. Generate a comprehensive project overview for the following idea.

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

## Success Metrics
Define 5-8 KPIs that will measure product success.

## Competitive Landscape
Brief analysis of 3-5 competitors and how this product differentiates.

## Risk Assessment
List top 5 risks with mitigation strategies.

Be specific, actionable, and professional. Use real-world examples where applicable.""",

        "requirements": f"""You are an expert Business Analyst and Product Manager. Generate comprehensive business and functional requirements.

{context}

Generate the following in well-structured Markdown:

## Functional Requirements
### Core Features
List 10-15 core functional requirements with priority (P0/P1/P2) and descriptions.

### User Stories
Write 10-15 user stories in the format: "As a [persona], I want to [action] so that [benefit]"

### Acceptance Criteria
For each top 5 user story, define 3-5 acceptance criteria.

## Non-Functional Requirements
### Performance
- Response time targets
- Throughput requirements
- Concurrent user capacity

### Scalability
- Horizontal scaling requirements
- Data growth projections

### Reliability
- Uptime SLA targets
- Disaster recovery requirements
- Data backup requirements

### Usability
- Accessibility standards (WCAG 2.1)
- Browser/device support matrix
- Internationalization requirements

### Security
- Authentication requirements
- Data encryption requirements
- Compliance requirements (GDPR, SOC2, HIPAA if applicable)

## Feature Priority Matrix
Create a MoSCoW priority matrix (Must Have, Should Have, Could Have, Won't Have).

Be thorough, specific, and actionable.""",

        "architecture": f"""You are an expert Solution Architect and Cloud Architect. Generate a comprehensive system architecture design.

{context}

Generate the following in well-structured Markdown:

## High-Level Architecture
Describe the overall system architecture pattern (microservices, monolith, serverless, etc.) and justify the choice.

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
Describe the main data flows through the system:
1. User authentication flow
2. Core business operation flow
3. Data processing pipeline (if applicable)

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

Provide specific technology recommendations with justifications.""",

        "database": f"""You are an expert Database Architect. Generate a comprehensive database design.

{context}

Generate the following in well-structured Markdown:

## Database Selection
Recommend primary database(s) with justification (PostgreSQL, MongoDB, DynamoDB, etc.)

## Entity Relationship Diagram
Describe all entities, their attributes, and relationships in detail.

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

Be specific with field types, constraints, and index definitions.""",

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

Be specific with request/response formats and status codes.""",

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

Be realistic and specific with timelines and estimates.""",

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

        "deployment": f"""You are an expert DevOps Engineer. Generate a comprehensive deployment and infrastructure design.

{context}

Generate the following in well-structured Markdown:

## CI/CD Pipeline
### Build Stage
- Build steps
- Linting and formatting
- Unit test execution
- Code coverage requirements

### Test Stage
- Integration tests
- E2E tests
- Security scanning
- Performance tests

### Deploy Stage
- Staging deployment
- Production deployment
- Blue-green deployment strategy
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
# docker-compose.yml
[Generate docker-compose for local development]
```

### Kubernetes (Production)
```yaml
# deployment.yaml
[Generate K8s deployment manifest]
```

## Monitoring
- Application monitoring (metrics to track)
- Infrastructure monitoring
- APM tool recommendation
- Dashboard design

## Logging
- Logging strategy
- Log aggregation tool
- Log retention policy
- Structured logging format

## Alerting
- Alert rules definition
- Escalation procedures
- On-call rotation

## Scalability
- Auto-scaling policies
- Load balancer configuration
- CDN configuration
- Database scaling strategy

## Disaster Recovery
- Backup strategy
- Recovery procedures
- Failover architecture
- Business continuity plan

## Storage Design
- File storage architecture
- Document management system
- Backup storage
- Archival strategy

Provide specific configurations and tool recommendations.""",
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

    # Get existing overview for context
    existing_overview = ""
    if section != "overview":
        overview_sec = project.get("sections", {}).get("overview", {})
        if overview_sec.get("status") == "done":
            existing_overview = overview_sec.get("content", "")

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

            # Save generated content
            now = datetime.now(timezone.utc).isoformat()
            await db.ai_builder_projects.update_one(
                {"id": project_id},
                {"$set": {
                    f"sections.{section}.content": full_content,
                    f"sections.{section}.status": "done",
                    f"sections.{section}.generated_at": now,
                    "updated_at": now,
                }}
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

        overview_content = ""

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
                    project.get("app_type", "saas"), overview_content
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

                if section == "overview":
                    overview_content = full

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
