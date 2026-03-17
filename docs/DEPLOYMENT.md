# MPS Platform - Backend Stack & Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MPS Platform Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Frontend   │────▶│  API Gateway │────▶│    Lambda Functions      │ │
│  │   (Next.js)  │     │  (AWS)       │     │    (Python/Node)         │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│         │                    │                         │                 │
│         │                    │                         │                 │
│         ▼                    ▼                         ▼                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Cognito    │     │   CloudWatch │     │      PostgreSQL          │ │
│  │  User Pool   │     │    Logs      │     │      (RDS/Aurora)        │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│                                                       │                 │
│                                            ┌──────────────────────────┐ │
│                                            │         S3               │ │
│                                            │   (File Storage)         │ │
│                                            └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Stack Components

### 1. AWS API Gateway

**Endpoint:** `https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod`

| Configuration | Value |
|--------------|-------|
| Region | us-east-1 |
| Stage | prod |
| API Type | REST API |
| Authentication | Cognito Authorizer |

#### API Routes Configured:

```
/shipments              - GET, POST
/shipments/{id}         - GET, PUT, DELETE
/shipments/{id}/line-items - GET
/shipments/{id}/external-identifiers - GET

/customers              - GET, POST
/customers/{id}         - GET, PUT, DELETE

/sites                  - GET, POST
/sites/{id}             - GET, PUT, DELETE
/sites/{id}/container-locations - GET

/vendors                - GET, POST
/vendors/{id}           - GET, PUT, DELETE

/waste-types            - GET, POST
/waste-types/{id}       - GET, PUT, DELETE

/transporters           - GET, POST
/transporters/{id}      - GET, PUT, DELETE

/receiving-facilities   - GET, POST
/receiving-facilities/{id} - GET, PUT, DELETE

/containers             - GET, POST
/containers/{id}        - GET, PUT, DELETE

/profiles               - GET, POST
/profiles/{id}          - GET, PUT, DELETE

/service-items          - GET, POST
/service-items/{id}     - GET, PUT, DELETE

/users                  - GET, POST
/users/{id}             - GET, PUT, DELETE
/users/profile          - GET, PUT
/users/{id}/sites       - GET

/roles                  - GET

/audit-log              - GET

/user-site-assignments  - GET, POST
/user-site-assignments/{id} - DELETE

# Reference Data (Read-only)
/reference-data         - GET
/units                  - GET
/container-types        - GET
/treatment-methods      - GET
/service-frequencies    - GET
/container-locations    - GET
/ewc-codes              - GET
/source-codes           - GET
/form-codes             - GET
/treatment-codes        - GET
/tri-waste-codes        - GET
/receiving-companies    - GET

# KPI & Analytics
/invoice-records        - GET
/invoice-records/{id}   - GET
/collection-events      - GET
/collection-events/{id} - GET
/container-placements   - GET
/container-placements/{id} - GET
/facility-capacities    - GET
/facility-capacities/{id} - GET
/fuel-records           - GET
/fuel-records/{id}      - GET
/route-schedules        - GET
/route-schedules/{id}   - GET
/truck-loads            - GET
/truck-loads/{id}       - GET
/safety-incidents       - GET
/safety-incidents/{id}  - GET
/inspection-records     - GET
/inspection-records/{id} - GET
/service-verifications  - GET
/service-verifications/{id} - GET
/container-weight-records - GET
/container-weight-records/{id} - GET
/platform-user-activity - GET
/platform-user-activity/{id} - GET
/customer-surveys       - GET
/customer-surveys/{id}  - GET

# Analytics Aggregations
/analytics/client-industry-codes - GET
/analytics/safety-training - GET
/analytics/route-progress - GET
/analytics/yard-turnaround - GET
/analytics/service-agreement-rates - GET
/analytics/platform-monthly-events - GET
/analytics/feature-usage - GET

# Exports & Uploads
/exports                - POST
/exports/{id}           - GET
/uploads/url            - POST
/uploads/process        - POST
/uploads/jobs/{id}      - GET
```

---

### 2. AWS Cognito (Authentication)

| Configuration | Value |
|--------------|-------|
| Region | us-east-1 |
| User Pool ID | us-east-1_23veUlUUb |
| App Client ID | 5o8a25t8ki8b2uo6ckponfg4t9 |
| Domain | mps-prod-639787407261.auth.us-east-1.amazoncognito.com |

#### User Groups (Roles):

| Group | Role | Permissions |
|-------|------|-------------|
| admin | Administrator | Full access to all features |
| manager | Manager | Read/write access, no user management |
| operator | Operator | Shipment creation and updates |
| viewer | Viewer | Read-only access |

#### Authentication Flow:

```
1. User enters credentials on login page
2. Frontend calls signIn() via AWS Amplify
3. Cognito validates credentials
4. Returns JWT tokens (ID, Access, Refresh)
5. Frontend stores tokens in memory
6. All API calls include Authorization: Bearer {idToken}
7. API Gateway validates token with Cognito
8. Request proceeds to Lambda
```

---

### 3. AWS Lambda Functions

Backend logic is implemented as serverless Lambda functions.

#### Function Categories:

| Category | Functions | Runtime |
|----------|-----------|---------|
| CRUD Operations | shipments-*, customers-*, sites-*, etc. | Python 3.11 / Node.js 18 |
| KPI Calculations | kpi-*, analytics-* | Python 3.11 |
| File Processing | uploads-*, exports-* | Python 3.11 |
| Authentication | auth-*, user-* | Node.js 18 |

#### Environment Variables:

```env
DATABASE_URL=postgresql://user:pass@host:5432/mps_db
S3_BUCKET=mps-uploads-prod
COGNITO_USER_POOL_ID=us-east-1_23veUlUUb
```

---

### 4. Database (PostgreSQL)

#### Connection Details:

| Parameter | Value |
|-----------|-------|
| Engine | PostgreSQL 15 |
| Host | RDS/Aurora endpoint |
| Database | mps_db |
| Schema | public |

#### Core Tables:

```sql
-- Core Entities
customers           -- Client/Customer records
sites               -- Customer site locations
vendors             -- Vendor/Supplier records
waste_types         -- Waste classification
transporters        -- Carrier/transporter records
receiving_facilities -- Disposal/receiving facilities
containers          -- Container inventory
profiles            -- Waste profiles
service_items       -- Service catalog
users               -- Platform users
user_site_assignments -- User-to-site mappings

-- Transaction Tables
shipments           -- Waste shipment records
shipment_line_items -- Shipment detail lines
shipment_costs_internal -- MPS costs
shipment_costs_customer -- Customer costs
shipment_external_identifiers -- External references

-- Reference Data
units               -- Units of measure
container_types     -- Container type definitions
treatment_methods   -- Treatment/disposal methods
service_frequencies -- Service frequency options
waste_codes         -- EPA/State waste codes
ewc_codes           -- European waste codes
source_codes        -- Generator source codes
form_codes          -- EPA form codes
treatment_codes     -- Treatment codes

-- KPI Tables
invoice_records     -- Invoice/billing data
collection_events   -- Collection tracking
container_placements -- Container utilization
facility_capacities -- Facility throughput
fuel_records        -- Fleet fuel data
route_schedules     -- Route planning
truck_loads         -- Load optimization
safety_incidents    -- Safety tracking
inspection_records  -- Compliance inspections
service_verifications -- Service QA
customer_surveys    -- CSAT/NPS data

-- System Tables
audit_log           -- Activity tracking
exports             -- Export job queue
upload_jobs         -- File processing queue
```

---

### 5. AWS S3 (File Storage)

#### Bucket Structure:

```
mps-uploads-prod/
├── uploads/
│   └── {year}/{month}/
│       └── {uuid}.{ext}
├── exports/
│   └── {year}/{month}/
│       └── {export_id}.csv
└── templates/
    └── import-templates/
```

---

## Deployment Steps

### Frontend Deployment

#### Prerequisites:
- Node.js 18+
- pnpm 8+
- AWS CLI configured
- Vercel CLI (optional)

#### Steps:

```bash
# 1. Clone repository
git clone git@github.com:seocontentai/mps-demo.git mps-frontend
cd mps-frontend

# 2. Install dependencies
pnpm install

# 3. Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_23veUlUUb
NEXT_PUBLIC_COGNITO_CLIENT_ID=5o8a25t8ki8b2uo6ckponfg4t9
NEXT_PUBLIC_COGNITO_DOMAIN=mps-prod-639787407261.auth.us-east-1.amazoncognito.com
EOF

# 4. Build application
pnpm build

# 5. Deploy (choose one)
# Option A: Vercel
vercel deploy --prod

# Option B: AWS Amplify
amplify publish

# Option C: Static export to S3/CloudFront
pnpm export
aws s3 sync out/ s3://mps-frontend-bucket/
```

---

### Backend Deployment (AWS SAM/CDK)

#### Using AWS SAM:

```bash
# 1. Build
sam build

# 2. Deploy
sam deploy \
  --stack-name mps-backend-prod \
  --s3-bucket mps-deployment-artifacts \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=prod \
    DatabaseUrl=$DATABASE_URL \
    CognitoUserPoolId=$COGNITO_USER_POOL_ID

# 3. Get API endpoint
aws cloudformation describe-stacks \
  --stack-name mps-backend-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

#### Using Terraform:

```hcl
# main.tf
module "api_gateway" {
  source = "./modules/api-gateway"

  name        = "mps-api"
  stage_name  = "prod"
  cognito_arn = module.cognito.user_pool_arn
}

module "lambda" {
  source = "./modules/lambda"

  for_each = var.lambda_functions

  function_name = each.key
  handler       = each.value.handler
  runtime       = each.value.runtime
  environment   = {
    DATABASE_URL = var.database_url
  }
}

module "rds" {
  source = "./modules/rds"

  identifier     = "mps-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
}
```

```bash
# Deploy
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

---

### Cognito User Setup

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_23veUlUUb \
  --username john.doe@example.com \
  --user-attributes \
    Name=email,Value=john.doe@example.com \
    Name=name,Value="John Doe" \
  --temporary-password "TempPass123!"

# Add user to group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_23veUlUUb \
  --username john.doe@example.com \
  --group-name manager
```

---

## Environment Configuration

### Development

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXX_dev
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx_dev
```

### Staging

```env
NEXT_PUBLIC_API_URL=https://staging-api.mps-platform.com
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXX_staging
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx_staging
```

### Production

```env
NEXT_PUBLIC_API_URL=https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_23veUlUUb
NEXT_PUBLIC_COGNITO_CLIENT_ID=5o8a25t8ki8b2uo6ckponfg4t9
NEXT_PUBLIC_COGNITO_DOMAIN=mps-prod-639787407261.auth.us-east-1.amazoncognito.com
```

---

## Monitoring & Logging

### CloudWatch Dashboards

| Dashboard | Metrics |
|-----------|---------|
| API Gateway | Request count, latency, 4xx/5xx errors |
| Lambda | Invocations, duration, errors, throttles |
| RDS | CPU, connections, read/write IOPS |
| Cognito | Sign-in attempts, failures |

### Log Groups

```
/aws/api-gateway/mps-api-prod
/aws/lambda/mps-shipments-handler
/aws/lambda/mps-customers-handler
/aws/lambda/mps-analytics-handler
/aws/rds/instance/mps-db/postgresql
```

### Alarms

| Alarm | Condition | Action |
|-------|-----------|--------|
| API 5xx Errors | > 10 in 5 min | SNS notification |
| Lambda Errors | > 5 in 1 min | SNS notification |
| RDS CPU | > 80% for 10 min | SNS notification |
| API Latency | p99 > 3s | SNS notification |

---

## Security

### IAM Roles

| Role | Purpose | Permissions |
|------|---------|-------------|
| mps-api-gateway-role | API Gateway execution | Lambda invoke |
| mps-lambda-execution-role | Lambda execution | RDS, S3, CloudWatch |
| mps-cognito-role | Cognito triggers | Lambda invoke |

### Network Security

- VPC with private subnets for RDS
- Security groups restrict access
- API Gateway with WAF
- SSL/TLS everywhere

### Data Protection

- Encryption at rest (RDS, S3)
- Encryption in transit (HTTPS)
- JWT token expiration: 1 hour
- Refresh token expiration: 30 days

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired | Re-authenticate |
| 403 Forbidden | Missing group/role | Add user to Cognito group |
| 500 Server Error | Lambda/DB error | Check CloudWatch logs |
| CORS Error | Missing headers | Verify API Gateway CORS config |

### Debug Commands

```bash
# Check API Gateway logs
aws logs filter-log-events \
  --log-group-name /aws/api-gateway/mps-api-prod \
  --start-time $(date -d '1 hour ago' +%s)000

# Check Lambda logs
aws logs tail /aws/lambda/mps-shipments-handler --follow

# Test API endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod/shipments
```
