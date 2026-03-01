# SafePrompt Design Document

## Overview

SafePrompt is a production-ready full-stack web application that acts as a security layer for AI usage in teams. The system provides:

1. **Prompt Scanning Interface**: ChatGPT-like UI for users to scan prompts before sending to AI tools
2. **Risk Detection Pipeline**: Multi-layered detection of PII, secrets, and business-sensitive content
3. **AI-Powered Rewriter**: LLM-based prompt rewriting to suggest safer alternatives
4. **Policy Engine**: Configurable security policies for organization-specific rules
5. **Analytics Dashboard**: CISO-level visibility into AI safety metrics and trends
6. **Secure Storage**: Privacy-compliant data storage without retaining raw prompts

The architecture follows a modern full-stack approach with a TypeScript/Node.js backend, React frontend, PostgreSQL database, and integration with external LLM services.

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ AI Playground    │  │ Admin Policies   │  │ Analytics    │  │
│  │ (Scan Interface) │  │ (Policy Mgmt)    │  │ (Dashboard)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ REST API (Express)│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Auth   │          │  Scan   │          │ Analytics│
   │ Service │          │ Service │          │ Service  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL DB  │
                    │  (Prisma ORM)   │
                    └─────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ Risk    │          │ Policy  │          │ Scan    │
   │Detection│          │ Engine  │          │ Events  │
   │Pipeline │          │         │          │ Storage │
   └─────────┘          └─────────┘          └─────────┘
        │
   ┌────▼──────────────────────────────┐
   │ External LLM Service (OpenAI API) │
   │ (for prompt rewriting)            │
   └──────────────────────────────────┘
```

### Technology Stack

**Backend**:
- Runtime: Node.js (v18+)
- Language: TypeScript (strict mode, no `any` types)
- Framework: Express.js
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT (JSON Web Tokens)
- Validation: Zod for runtime schema validation
- Logging: Winston or Pino

**Frontend**:
- Framework: React 18+
- Language: TypeScript
- Styling: Tailwind CSS with dark mode support
- UI Components: Shadcn/ui or Radix UI
- Charts: Recharts for analytics visualizations
- HTTP Client: Axios or Fetch API
- State Management: React Context API or Zustand

**Infrastructure**:
- Containerization: Docker
- Environment: Node.js + PostgreSQL
- LLM Integration: OpenAI API (GPT-4 or GPT-3.5-turbo)

## Components and Interfaces

### Backend Components

#### 1. Authentication Service
- User login/logout
- JWT token generation and validation
- Password hashing (bcrypt)
- Role-based access control (RBAC)

#### 2. Scan Service
- Orchestrates the risk detection pipeline
- Calls risk detection engine
- Calls LLM rewriter for MEDIUM/HIGH risk
- Stores scan events
- Returns structured scan results

#### 3. Risk Detection Pipeline
- **PII Detector**: Regex patterns + ML-based detection for emails, phone numbers, SSNs, addresses
- **Secret Detector**: Pattern matching for API keys, tokens, passwords
- **Business-Sensitive Detector**: Keyword matching for contract, revenue, salary, customer list, proprietary
- **Policy Applier**: Applies policy rules to detection results
- **Risk Classifier**: Determines overall risk level based on detections

#### 4. Policy Engine
- CRUD operations for policies
- Default policy seeding
- Policy application during scans
- Custom keyword matching

#### 5. Analytics Service
- Aggregates scan events
- Computes statistics (total scans, risk distribution)
- Generates timeline data for charts
- Retrieves top risk categories

#### 6. LLM Integration Service
- Calls OpenAI API for prompt rewriting
- Handles API errors gracefully
- Provides fallback generic rewrites
- Manages rate limiting and retries

### Frontend Components

#### 1. AI Playground Page
- Text input field for prompt entry
- Policy selector dropdown
- Scan button
- Results display area with risk level badge
- Detected entities display
- Suggested rewrite display

#### 2. Admin Policies Page
- Policy list with CRUD operations
- Policy editor form
- Custom keywords input
- Policy toggle switches (blockSecrets, warnOnPII, strictHealthTerms)

#### 3. Analytics Dashboard
- Total scans metric
- Risk distribution pie chart
- Risk timeline line chart
- Top risk categories bar chart
- Real-time updates

#### 4. Authentication Components
- Login form
- Logout button
- Protected route wrapper

## Data Models

### Database Schema

```typescript
// User Table
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  passwordHash String
  role      Role     @default(USER)  // USER | ADMIN
  createdAt DateTime @default(now())
  
  scanEvents ScanEvent[]
}

// Policy Table
model Policy {
  id                String   @id @default(cuid())
  name              String   @unique
  blockSecrets      Boolean  @default(true)
  warnOnPII         Boolean  @default(true)
  strictHealthTerms Boolean  @default(false)
  customKeywords    String[] @default([])  // JSON array
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  scanEvents ScanEvent[]
}

// ScanEvent Table
model ScanEvent {
  id          String   @id @default(cuid())
  promptHash  String   // SHA256 hash of original prompt
  riskLevel   RiskLevel // LOW | MEDIUM | HIGH
  categories  String[] // JSON array of risk categories
  policyId    String
  userId      String
  createdAt   DateTime @default(now())
  
  policy      Policy   @relation(fields: [policyId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([policyId])
  @@index([userId])
  @@index([createdAt])
  @@index([riskLevel])
}

enum Role {
  USER
  ADMIN
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}
```

### Data Structures (TypeScript Interfaces)

```typescript
// Scan Request/Response
interface ScanRequest {
  prompt: string
  policyId: string
}

interface DetectedEntity {
  type: string  // "email", "phone", "ssn", "api_key", etc.
  value: string
  position: number  // character position in prompt
}

interface ScanResponse {
  riskLevel: RiskLevel
  categories: string[]  // ["PII", "Secrets", "Business-Sensitive"]
  detectedEntities: DetectedEntity[]
  explanation: string  // Human-readable risk explanation
  suggestedRewrite: string | null  // Only for MEDIUM/HIGH risk
}

// Policy
interface PolicyDTO {
  id: string
  name: string
  blockSecrets: boolean
  warnOnPII: boolean
  strictHealthTerms: boolean
  customKeywords: string[]
  createdAt: Date
}

// Analytics
interface AnalyticsSummary {
  totalScans: number
  riskDistribution: {
    LOW: number
    MEDIUM: number
    HIGH: number
  }
  topCategories: Array<{ category: string; count: number }>
}

interface TimelineData {
  timestamp: Date
  LOW: number
  MEDIUM: number
  HIGH: number
}

// Auth
interface LoginRequest {
  email: string
  password: string
}

interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    role: Role
  }
}
```

## API Design

### Authentication Endpoints

```
POST /api/auth/login
  Request: { email: string, password: string }
  Response: { token: string, user: { id, email, role } }
  Status: 200 | 401 | 400

POST /api/auth/logout
  Response: { message: string }
  Status: 200
```

### Scan Endpoints

```
POST /api/scan
  Headers: Authorization: Bearer <token>
  Request: { prompt: string, policyId: string }
  Response: {
    riskLevel: "LOW" | "MEDIUM" | "HIGH",
    categories: string[],
    detectedEntities: Array<{ type, value, position }>,
    explanation: string,
    suggestedRewrite: string | null
  }
  Status: 200 | 400 | 401 | 500
```

### Policy Endpoints

```
GET /api/policies
  Headers: Authorization: Bearer <token>
  Response: Policy[]
  Status: 200 | 401

POST /api/policies
  Headers: Authorization: Bearer <token> (ADMIN only)
  Request: { name, blockSecrets, warnOnPII, strictHealthTerms, customKeywords }
  Response: Policy
  Status: 201 | 400 | 401 | 403

PUT /api/policies/:id
  Headers: Authorization: Bearer <token> (ADMIN only)
  Request: { name?, blockSecrets?, warnOnPII?, strictHealthTerms?, customKeywords? }
  Response: Policy
  Status: 200 | 400 | 401 | 403 | 404

GET /api/policies/:id
  Headers: Authorization: Bearer <token>
  Response: Policy
  Status: 200 | 401 | 404
```

### Analytics Endpoints

```
GET /api/analytics/summary
  Headers: Authorization: Bearer <token> (ADMIN only)
  Response: {
    totalScans: number,
    riskDistribution: { LOW, MEDIUM, HIGH },
    topCategories: Array<{ category, count }>
  }
  Status: 200 | 401 | 403

GET /api/analytics/timeline?startDate=ISO&endDate=ISO
  Headers: Authorization: Bearer <token> (ADMIN only)
  Response: Array<{ timestamp, LOW, MEDIUM, HIGH }>
  Status: 200 | 400 | 401 | 403
```



## Frontend Architecture

### Page Structure

#### 1. Login Page (`/login`)
- Email and password input fields
- Login button
- Error message display
- Redirect to dashboard on success

#### 2. AI Playground Page (`/ai-playground`)
- Header with logout button
- Policy selector dropdown
- Large text input area for prompt
- Scan button
- Results panel (conditionally rendered):
  - Risk level badge with color coding
  - Risk explanation text
  - Detected entities list
  - Suggested rewrite (if MEDIUM/HIGH)
- Loading state during scan
- Error message display

#### 3. Admin Policies Page (`/admin/policies`)
- Policy list table with columns: Name, blockSecrets, warnOnPII, strictHealthTerms, Actions
- Create new policy button
- Edit policy modal/form
- Delete policy confirmation
- Custom keywords input (comma-separated or array)

#### 4. Admin Analytics Page (`/admin/analytics`)
- Total scans metric card
- Risk distribution pie chart (Recharts)
- Risk timeline line chart (Recharts)
- Top risk categories bar chart (Recharts)
- Date range filter (optional)
- Auto-refresh capability

### Component Hierarchy

```
App
├── Router
│   ├── LoginPage
│   ├── ProtectedRoute
│   │   ├── AIPlaygroundPage
│   │   ├── AdminPoliciesPage
│   │   └── AdminAnalyticsPage
│   └── NotFoundPage
├── AuthContext (provides user, token, login, logout)
└── ThemeProvider (dark mode)
```

### State Management

- **AuthContext**: User authentication state, JWT token, role
- **Local component state**: Form inputs, loading states, scan results
- **Optional**: Zustand store for global UI state (theme, notifications)

## Security Considerations

### Authentication & Authorization

1. **JWT-based Authentication**:
   - Tokens issued on login with 24-hour expiration
   - Tokens stored in httpOnly cookies (not localStorage)
   - Refresh token mechanism for extended sessions
   - Token validation on every protected endpoint

2. **Role-Based Access Control (RBAC)**:
   - USER role: Access to /ai-playground only
   - ADMIN role: Access to /admin/* routes
   - Middleware enforces role checks on backend
   - Frontend route guards prevent unauthorized navigation

3. **Password Security**:
   - Passwords hashed with bcrypt (salt rounds: 10+)
   - Never store or transmit plain passwords
   - Minimum password requirements enforced

### Data Privacy

1. **Prompt Hashing**:
   - Raw prompts never stored in database
   - SHA256 hash computed and stored instead
   - Enables analytics without retaining sensitive content
   - Complies with GDPR and data protection regulations

2. **Sensitive Data Handling**:
   - Detected entities logged but not raw prompt content
   - Scan results cached in memory only (not persisted)
   - Database queries use parameterized statements (Prisma prevents SQL injection)

3. **API Security**:
   - HTTPS enforced in production
   - CORS configured to allow only trusted origins
   - Rate limiting on /api/scan endpoint (prevent abuse)
   - Input validation on all endpoints (Zod schemas)

### LLM Integration Security

1. **API Key Management**:
   - OpenAI API key stored in environment variables
   - Never exposed to frontend
   - Rotated regularly

2. **Prompt Rewriting Safety**:
   - Rewrite requests include policy context
   - Rewrite results validated before returning to user
   - Fallback generic rewrite if LLM service fails

## Integration Points

### External LLM Service (OpenAI API)

**Purpose**: Generate safer prompt rewrites for MEDIUM/HIGH risk scans

**Integration Flow**:
1. Scan service detects MEDIUM/HIGH risk
2. Calls LLM service with original prompt + policy context
3. LLM service calls OpenAI API with system prompt instructing rewrite
4. Returns rewritten prompt to scan service
5. Scan service includes rewrite in response

**Error Handling**:
- If LLM service unavailable: Return generic rewrite suggestion
- If API rate limit exceeded: Queue request for retry
- If API error: Log error and provide fallback

**System Prompt for LLM**:
```
You are a security-focused prompt rewriter. Your task is to rewrite user prompts 
to remove or mask sensitive data while preserving the original intent.

Guidelines:
- Remove or mask PII (emails, phone numbers, SSNs, addresses)
- Remove or mask secrets (API keys, tokens, passwords)
- Remove or mask business-sensitive information
- Preserve the core task/question the user is asking
- Keep the rewrite concise and natural

Original prompt: {prompt}
Policy context: {policyContext}

Provide only the rewritten prompt, no explanation.
```

### Authentication Service Integration

**Purpose**: Validate user credentials and issue JWT tokens

**Integration Flow**:
1. User submits login credentials
2. Auth service queries User table by email
3. Compares submitted password with stored hash
4. If valid: Generates JWT token with user ID and role
5. Returns token and user info to frontend
6. Frontend stores token and uses in Authorization header

## Error Handling

### Backend Error Handling

1. **Validation Errors** (400):
   - Invalid request body
   - Missing required fields
   - Invalid policy ID or user ID

2. **Authentication Errors** (401):
   - Missing or invalid JWT token
   - Token expired
   - Invalid credentials

3. **Authorization Errors** (403):
   - User lacks required role
   - Attempting to access admin routes as USER

4. **Not Found Errors** (404):
   - Policy not found
   - User not found
   - Scan event not found

5. **Server Errors** (500):
   - Database connection failure
   - LLM service unavailable
   - Unexpected exceptions

### Error Response Format

```typescript
interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
}
```

### Frontend Error Handling

1. **Network Errors**: Display user-friendly message, retry option
2. **Validation Errors**: Display field-level error messages
3. **Authentication Errors**: Redirect to login
4. **Authorization Errors**: Display "Access Denied" message
5. **Server Errors**: Display generic error message with error ID for support

## Testing Strategy

### Unit Testing

**Backend**:
- Risk detection pipeline (PII, secret, keyword detection)
- Policy application logic
- Risk classification logic
- Analytics aggregation functions
- Auth service (password hashing, JWT generation)

**Frontend**:
- Component rendering with various props
- Form validation
- Error message display
- Chart rendering with sample data

### Property-Based Testing

Property-based testing validates universal correctness properties across many generated inputs.

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

#### Correctness Properties

**Property 1: Scan Determinism**
*For any* prompt and policy combination, scanning the same prompt with the same policy multiple times SHALL produce identical risk levels and detected entities.
**Validates: Requirements 2.1-2.8**

**Property 2: Risk Level Consistency**
*For any* scan result, if secrets are detected and blockSecrets is enabled, the risk level SHALL be HIGH; if only PII is detected and warnOnPII is enabled, the risk level SHALL be MEDIUM or HIGH; if only minor keywords are detected, the risk level SHALL be LOW.
**Validates: Requirements 2.4-2.6**

**Property 3: Hash Consistency**
*For any* prompt, computing SHA256 hash multiple times SHALL produce identical results, and the hash SHALL never be null or empty.
**Validates: Requirements 6.1-6.2**

**Property 4: Policy Application Idempotence**
*For any* policy and scan result, applying the policy multiple times to the same scan result SHALL produce identical classifications.
**Validates: Requirements 4.4-4.8**

**Property 5: Analytics Aggregation Correctness**
*For any* set of scan events, the total scans count SHALL equal the sum of all risk level counts (LOW + MEDIUM + HIGH).
**Validates: Requirements 5.2-5.7**

**Property 6: JWT Token Validity**
*For any* valid user, a JWT token issued at login SHALL be valid for exactly 24 hours, after which it SHALL be invalid.
**Validates: Requirements 7.2, 7.6**

**Property 7: Role-Based Access Control**
*For any* user with USER role, accessing /admin/* routes SHALL return 403 Forbidden; for any user with ADMIN role, accessing /admin/* routes SHALL return 200 OK.
**Validates: Requirements 7.3-7.5**

**Property 8: Rewrite Availability**
*For any* scan with MEDIUM or HIGH risk, a suggestedRewrite SHALL be present in the response; for any scan with LOW risk, suggestedRewrite SHALL be null.
**Validates: Requirements 3.1, 3.4**

**Property 9: Detected Entity Accuracy**
*For any* detected entity in a scan result, the entity value SHALL be a substring of the original prompt at the specified position.
**Validates: Requirements 2.7**

**Property 10: Policy Persistence**
*For any* policy created or updated, querying the database immediately after SHALL return the same policy data.
**Validates: Requirements 4.3, 4.9**

### Integration Testing

- End-to-end scan flow (login → scan → view results)
- Policy creation and application
- Analytics dashboard data accuracy
- LLM integration with fallback behavior
- Database persistence and retrieval

### Performance Testing

- Scan completion within 2 seconds (Requirement 14.1)
- Analytics dashboard load within 1 second (Requirement 14.2)
- Concurrent request handling (Requirement 14.3)
- Database query performance with indexes (Requirement 14.4)



## Implementation Considerations

### Risk Detection Pipeline Details

#### PII Detection
- **Email**: Regex pattern for standard email format
- **Phone Numbers**: Regex for US format (XXX-XXX-XXXX, (XXX) XXX-XXXX, etc.)
- **SSN**: Regex for XXX-XX-XXXX format
- **Physical Addresses**: Keyword matching + pattern recognition for street, city, state, ZIP

#### Secret Detection
- **API Keys**: Patterns for common formats (AWS, OpenAI, Stripe, etc.)
- **Tokens**: Bearer token patterns, JWT patterns
- **Passwords**: Common password indicators ("password=", "pwd:", etc.)

#### Business-Sensitive Detection
- **Keywords**: contract, revenue, salary, customer list, proprietary, confidential, merger, acquisition, patent
- **Customizable**: Policies can add custom keywords

#### Risk Classification Algorithm

```
if (secretsDetected && policy.blockSecrets) {
  riskLevel = HIGH
} else if ((piiDetected || businessSensitiveDetected) && policy.warnOnPII) {
  riskLevel = MEDIUM
} else if (customKeywordsDetected) {
  riskLevel = MEDIUM
} else {
  riskLevel = LOW
}

if (policy.strictHealthTerms && healthTermsDetected) {
  riskLevel = max(riskLevel, MEDIUM)
}
```

### Default Policies

**1. Startup Default**
- blockSecrets: true
- warnOnPII: true
- strictHealthTerms: false
- customKeywords: []

**2. Health Strict**
- blockSecrets: true
- warnOnPII: true
- strictHealthTerms: true
- customKeywords: ["patient", "diagnosis", "treatment", "medication", "medical record"]

**3. Enterprise Confidential**
- blockSecrets: true
- warnOnPII: true
- strictHealthTerms: false
- customKeywords: ["confidential", "proprietary", "trade secret", "internal only", "restricted"]

### Seed Data

**Demo Users**:
- Email: user@demo.com, Password: demo123, Role: USER
- Email: admin@demo.com, Password: admin123, Role: ADMIN

**Demo Scan Events** (optional):
- Pre-populate with sample scans to demonstrate analytics

### Environment Variables

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/safeprompt

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Architecture

### Docker Setup

**Dockerfile** (Node.js backend):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/safeprompt
      - JWT_SECRET=dev-secret
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=safeprompt
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3000

volumes:
  postgres_data:
```

### Database Initialization

1. Run Prisma migrations: `npx prisma migrate deploy`
2. Seed default policies and demo users: `npx prisma db seed`
3. Create indexes for performance

### Performance Optimization

1. **Database Indexes**:
   - ScanEvent.policyId
   - ScanEvent.userId
   - ScanEvent.createdAt
   - ScanEvent.riskLevel

2. **Caching**:
   - Cache policy list in memory (invalidate on update)
   - Cache analytics summary (invalidate on new scan)
   - Use Redis for distributed caching (optional)

3. **Query Optimization**:
   - Use Prisma select to fetch only needed fields
   - Batch analytics queries
   - Pagination for large result sets

4. **Frontend Optimization**:
   - Code splitting by route
   - Lazy load analytics charts
   - Memoize expensive computations

## Code Organization

```
safeprompt/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── scanController.ts
│   │   │   ├── policyController.ts
│   │   │   └── analyticsController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── scanService.ts
│   │   │   ├── riskDetectionService.ts
│   │   │   ├── policyService.ts
│   │   │   ├── analyticsService.ts
│   │   │   └── llmService.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── scan.ts
│   │   │   ├── policies.ts
│   │   │   └── analytics.ts
│   │   ├── models/
│   │   │   └── types.ts
│   │   ├── utils/
│   │   │   ├── hash.ts
│   │   │   ├── jwt.ts
│   │   │   └── validators.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── property/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── AIPlayground.tsx
│   │   │   ├── PolicyManager.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ScanResults.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── AIPlaygroundPage.tsx
│   │   │   ├── AdminPoliciesPage.tsx
│   │   │   ├── AdminAnalyticsPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useScan.ts
│   │   │   └── useAnalytics.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Key Design Decisions

### 1. No Raw Prompt Storage
**Decision**: Store only SHA256 hashes of prompts, never raw text
**Rationale**: Ensures GDPR/CCPA compliance, protects user privacy, reduces storage requirements
**Trade-off**: Cannot retrieve original prompts for audit, but analytics still available

### 2. JWT-based Authentication
**Decision**: Stateless JWT tokens instead of session-based auth
**Rationale**: Scales better for distributed systems, simpler deployment, works well with SPAs
**Trade-off**: Token revocation requires additional logic (token blacklist or short expiration)

### 3. Synchronous Scan Processing
**Decision**: Scan requests processed synchronously with 2-second timeout
**Rationale**: Users expect immediate feedback, most scans complete quickly
**Trade-off**: Very slow scans may timeout; could add async queue for future scaling

### 4. LLM Rewriting Only for MEDIUM/HIGH
**Decision**: Only call LLM for MEDIUM/HIGH risk scans
**Rationale**: Reduces API costs, improves performance, LOW risk doesn't need rewriting
**Trade-off**: Users can't get rewrites for LOW risk prompts

### 5. In-Memory Policy Caching
**Decision**: Cache policies in memory with invalidation on update
**Rationale**: Policies rarely change, improves scan performance
**Trade-off**: Requires cache invalidation logic, potential stale data in distributed systems

## Monitoring and Observability

### Logging
- Structured logging with Winston/Pino
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request ID for tracing
- Log all authentication attempts and policy changes

### Metrics
- Scan count per hour/day
- Average scan duration
- Risk level distribution
- API error rates
- LLM API call success rate

### Alerts
- High error rate (>5% of requests)
- LLM service unavailable
- Database connection failures
- Unusual spike in HIGH risk scans

