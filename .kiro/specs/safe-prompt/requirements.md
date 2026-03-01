# SafePrompt Requirements Document

## Introduction

SafePrompt is a production-ready full-stack web application that acts as a security layer for AI usage in teams. It scans prompts before they're sent to AI tools to detect sensitive content, classify risk levels, explain risks, and suggest safer rewrites. The system provides a ChatGPT-like interface for prompt scanning, a configurable policy engine for security teams, and an analytics dashboard for CISO-level visibility into AI safety metrics.

## Glossary

- **Prompt**: User-provided text input intended to be sent to an AI service
- **Scan**: The process of analyzing a prompt for sensitive data and security risks
- **Risk Level**: Classification of prompt safety: LOW, MEDIUM, or HIGH
- **PII (Personally Identifiable Information)**: Data that can identify individuals (email, phone, SSN, addresses)
- **Secret**: Sensitive credentials (API keys, tokens, passwords)
- **Policy**: Configurable security rules that control scan behavior and risk thresholds
- **Risk Category**: Classification of detected sensitive content (e.g., "PII", "Secrets", "Business-Sensitive")
- **Detected Entity**: Specific instance of sensitive data found in a prompt (e.g., an email address)
- **Prompt Hash**: SHA256 hash of the original prompt used for storage without retaining raw content
- **Rewrite**: AI-generated version of a prompt with sensitive data removed or masked
- **ScanEvent**: Database record of a completed prompt scan
- **JWT**: JSON Web Token used for stateless authentication
- **Admin**: User with elevated permissions to view analytics and manage policies
- **User**: Standard team member who can scan prompts

## Requirements

### Requirement 1: Prompt Scanning Interface

**User Story:** As a team member, I want to scan prompts for security risks before sending them to AI tools, so that I can prevent accidental disclosure of sensitive information.

#### Acceptance Criteria

1. WHEN a user navigates to /ai-playground THEN the system SHALL display a ChatGPT-like interface with a text input field and scan button
2. WHEN a user types a prompt and clicks "Scan Prompt" THEN the system SHALL send the prompt and selected policy ID to POST /api/scan
3. WHEN the backend receives a scan request THEN the system SHALL analyze the prompt using the risk detection pipeline
4. WHEN the scan completes THEN the system SHALL return a response containing riskLevel, categories, detectedEntities, explanation, and suggestedRewrite
5. WHEN the scan response is received THEN the system SHALL display the risk level with appropriate color coding (Green for LOW, Yellow for MEDIUM, Red for HIGH)
6. WHEN a user views scan results THEN the system SHALL display detected entities and a human-readable explanation of the risks
7. WHEN risk is MEDIUM or HIGH THEN the system SHALL display a suggested rewrite of the prompt with sensitive data removed or masked

### Requirement 2: Risk Detection Pipeline

**User Story:** As a security engineer, I want the system to detect multiple types of sensitive data in prompts, so that I can ensure comprehensive coverage of security risks.

#### Acceptance Criteria

1. WHEN a prompt is scanned THEN the system SHALL detect PII including email addresses, phone numbers, SSNs, and physical addresses
2. WHEN a prompt is scanned THEN the system SHALL detect secrets including API keys, authentication tokens, and passwords
3. WHEN a prompt is scanned THEN the system SHALL detect business-sensitive keywords such as contract, revenue, salary, customer list, and proprietary information
4. WHEN multiple types of sensitive data are detected THEN the system SHALL classify the risk as HIGH if secrets are present
5. WHEN PII and business-sensitive keywords are detected THEN the system SHALL classify the risk as MEDIUM
6. WHEN only minor keywords are detected THEN the system SHALL classify the risk as LOW
7. WHEN sensitive data is detected THEN the system SHALL return specific detected entities with their locations in the prompt
8. WHEN a prompt contains no sensitive data THEN the system SHALL classify the risk as LOW

### Requirement 3: AI-Powered Prompt Rewriter

**User Story:** As a user, I want the system to suggest safer versions of my prompts, so that I can maintain my original intent while removing sensitive data.

#### Acceptance Criteria

1. WHEN a scan result has MEDIUM or HIGH risk THEN the system SHALL call an LLM to generate a rewritten prompt
2. WHEN the LLM rewrites a prompt THEN the system SHALL instruct it to remove or mask sensitive data while preserving the original task intent
3. WHEN the rewrite is complete THEN the system SHALL return the suggested rewrite to the frontend
4. WHEN a user views a suggested rewrite THEN the system SHALL display it alongside the original risk analysis
5. WHEN the LLM service is unavailable THEN the system SHALL gracefully handle the error and return a generic rewrite suggestion

### Requirement 4: Configurable Policy Engine

**User Story:** As a security administrator, I want to configure security policies that control how prompts are scanned, so that I can enforce organization-specific security standards.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/policies THEN the system SHALL display a policy management dashboard
2. WHEN the system initializes THEN the system SHALL seed the database with three default policies: Startup Default, Health Strict, and Enterprise Confidential
3. WHEN a policy is created or updated THEN the system SHALL store it with properties: id, name, blockSecrets, warnOnPII, strictHealthTerms, and customKeywords array
4. WHEN a user scans a prompt THEN the system SHALL apply the selected policy to control detection behavior
5. WHEN blockSecrets is enabled in a policy THEN the system SHALL classify any prompt containing secrets as HIGH risk
6. WHEN warnOnPII is enabled in a policy THEN the system SHALL flag prompts containing PII as MEDIUM or HIGH risk
7. WHEN strictHealthTerms is enabled in a policy THEN the system SHALL apply stricter detection for health-related sensitive keywords
8. WHEN customKeywords are defined in a policy THEN the system SHALL detect those keywords and flag prompts containing them
9. WHEN an admin edits a policy THEN the system SHALL update the policy in the database and apply changes to future scans

### Requirement 5: Analytics Dashboard

**User Story:** As a CISO, I want to view analytics about prompt scanning activity and risk distribution, so that I can understand AI safety trends and make informed security decisions.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/analytics THEN the system SHALL display a comprehensive analytics dashboard
2. WHEN the dashboard loads THEN the system SHALL display the total number of prompts scanned
3. WHEN the dashboard loads THEN the system SHALL display a pie chart showing the distribution of risk levels (LOW, MEDIUM, HIGH)
4. WHEN the dashboard loads THEN the system SHALL display a line chart showing risk levels over time
5. WHEN the dashboard loads THEN the system SHALL display a bar chart showing the top risk categories detected
6. WHEN new scan events are recorded THEN the system SHALL update all dashboard charts dynamically
7. WHEN the dashboard is viewed THEN the system SHALL use real data from the database to populate all visualizations
8. WHEN a user views the dashboard THEN the system SHALL display data using Recharts for professional visualization

### Requirement 6: Secure Data Storage

**User Story:** As a privacy officer, I want the system to store scan data securely without retaining raw prompts, so that I can maintain compliance with data protection regulations.

#### Acceptance Criteria

1. WHEN a prompt is scanned THEN the system SHALL NOT store the raw prompt text
2. WHEN a prompt is scanned THEN the system SHALL compute a SHA256 hash of the prompt
3. WHEN a scan event is recorded THEN the system SHALL store only the hash, riskLevel, categories, timestamp, and policyId
4. WHEN scan data is queried THEN the system SHALL retrieve only the hashed and aggregated information
5. WHEN the database is accessed THEN the system SHALL ensure no raw prompt content is persisted

### Requirement 7: User Authentication and Authorization

**User Story:** As a team lead, I want to manage user access to SafePrompt with role-based permissions, so that I can control who can scan prompts and who can view analytics.

#### Acceptance Criteria

1. WHEN a user accesses the application THEN the system SHALL require email and password authentication
2. WHEN a user logs in with valid credentials THEN the system SHALL issue a JWT token
3. WHEN a user has the USER role THEN the system SHALL allow them to access /ai-playground and scan prompts
4. WHEN a user has the ADMIN role THEN the system SHALL allow them to access /admin/policies and /admin/analytics
5. WHEN a user has the USER role THEN the system SHALL prevent them from accessing admin routes
6. WHEN a JWT token expires THEN the system SHALL require the user to log in again
7. WHEN a user logs out THEN the system SHALL invalidate their session

### Requirement 8: Database Schema and Persistence

**User Story:** As a developer, I want a well-structured database schema that supports all application features, so that I can reliably store and retrieve user, policy, and scan data.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL create User, Policy, and ScanEvent tables
2. WHEN a user is created THEN the system SHALL store id, email, passwordHash, role, and createdAt
3. WHEN a policy is created THEN the system SHALL store id, name, blockSecrets, warnOnPII, strictHealthTerms, customKeywords (JSON), and createdAt
4. WHEN a scan event is recorded THEN the system SHALL store id, promptHash, riskLevel, categories (JSON), policyId, userId, and createdAt
5. WHEN scan events are queried THEN the system SHALL support filtering by date range, risk level, and policy
6. WHEN the database is accessed THEN the system SHALL use Prisma ORM for type-safe queries

### Requirement 9: API Endpoints

**User Story:** As a frontend developer, I want well-defined REST API endpoints that support all application features, so that I can build a responsive user interface.

#### Acceptance Criteria

1. WHEN a POST request is sent to /api/scan THEN the system SHALL accept { prompt, policyId } and return { riskLevel, categories, detectedEntities, explanation, suggestedRewrite }
2. WHEN a POST request is sent to /api/auth/login THEN the system SHALL accept { email, password } and return { token, user }
3. WHEN a GET request is sent to /api/policies THEN the system SHALL return all available policies
4. WHEN a GET request is sent to /api/analytics/summary THEN the system SHALL return total scans, risk distribution, and top categories
5. WHEN a GET request is sent to /api/analytics/timeline THEN the system SHALL return risk levels over time for charting
6. WHEN a POST request is sent to /api/policies THEN the system SHALL create a new policy (admin only)
7. WHEN a PUT request is sent to /api/policies/:id THEN the system SHALL update an existing policy (admin only)
8. WHEN a request is made without a valid JWT token THEN the system SHALL return a 401 Unauthorized response

### Requirement 10: User Interface Design

**User Story:** As a user, I want a professional, intuitive interface that clearly communicates security risks, so that I can quickly understand scan results and take appropriate action.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a dark mode interface by default
2. WHEN a user views scan results THEN the system SHALL display risk level badges with color coding (Green for LOW, Yellow for MEDIUM, Red for HIGH)
3. WHEN a user views the /ai-playground page THEN the system SHALL display a clean, minimalistic ChatGPT-like interface
4. WHEN a user views the analytics dashboard THEN the system SHALL display professional charts and metrics using glassmorphism design
5. WHEN a user hovers over risk indicators THEN the system SHALL display tooltips explaining the risk category
6. WHEN a user views detected entities THEN the system SHALL display them in a readable format with context
7. WHEN the interface is viewed on different screen sizes THEN the system SHALL be responsive and maintain usability

### Requirement 11: Error Handling and Resilience

**User Story:** As a user, I want the system to handle errors gracefully and provide helpful feedback, so that I can understand what went wrong and take corrective action.

#### Acceptance Criteria

1. WHEN an API request fails THEN the system SHALL return an appropriate HTTP status code and error message
2. WHEN the LLM service is unavailable THEN the system SHALL gracefully degrade and provide a generic rewrite suggestion
3. WHEN a database query fails THEN the system SHALL log the error and return a user-friendly error message
4. WHEN invalid input is provided THEN the system SHALL validate and reject it with a clear error message
5. WHEN a user attempts an unauthorized action THEN the system SHALL return a 403 Forbidden response
6. WHEN the system encounters an unexpected error THEN the system SHALL log it for debugging and return a generic error message

### Requirement 12: Code Quality and Maintainability

**User Story:** As a developer, I want the codebase to follow best practices and be well-organized, so that I can maintain and extend the application efficiently.

#### Acceptance Criteria

1. WHEN code is written THEN the system SHALL use strict TypeScript with no `any` types
2. WHEN the codebase is organized THEN the system SHALL follow a clean folder structure separating services, controllers, routes, and models
3. WHEN functions are implemented THEN the system SHALL include comments explaining complex logic and demo-specific behavior
4. WHEN the application is deployed THEN the system SHALL support Docker containerization
5. WHEN a developer sets up the project THEN the system SHALL provide a comprehensive README with setup instructions
6. WHEN environment variables are used THEN the system SHALL provide an example .env file with all required variables
7. WHEN the codebase is reviewed THEN the system SHALL demonstrate proper error handling middleware and validation

### Requirement 13: Seed Data and Initialization

**User Story:** As a developer, I want the system to initialize with seed data, so that I can quickly demo the application without manual setup.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL seed three default policies: Startup Default, Health Strict, and Enterprise Confidential
2. WHEN the application initializes THEN the system SHALL create demo user accounts with different roles
3. WHEN the database is reset THEN the system SHALL repopulate seed data automatically
4. WHEN a user logs in with demo credentials THEN the system SHALL grant appropriate permissions based on their role

### Requirement 14: Performance and Scalability

**User Story:** As an operations engineer, I want the system to perform efficiently under load, so that I can scale it to support growing team usage.

#### Acceptance Criteria

1. WHEN a prompt is scanned THEN the system SHALL complete the scan within 2 seconds
2. WHEN the analytics dashboard loads THEN the system SHALL retrieve and display data within 1 second
3. WHEN multiple users scan prompts simultaneously THEN the system SHALL handle concurrent requests without degradation
4. WHEN the database grows THEN the system SHALL maintain query performance through appropriate indexing

