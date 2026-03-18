# Microsoft SSO Setup Guide for MPS Platform

This guide walks you through setting up Microsoft Single Sign-On (SSO) for the MPS Waste Management Platform.

## Overview

Users will be able to click "Sign in with Microsoft" and authenticate using their Microsoft account (personal, work, or school). New users are automatically created in the system on first sign-in.

## Step 1: Register Application in Microsoft Azure

### 1.1 Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with a Microsoft account that has admin access to your organization's Azure AD

### 1.2 Create App Registration

1. Navigate to **Azure Active Directory** (or search for "App registrations")
2. Click **+ New registration**
3. Fill in the details:
   - **Name**: `MPS Waste Management Platform`
   - **Supported account types**: Choose based on your needs:
     - `Accounts in this organizational directory only` - Only your organization
     - `Accounts in any organizational directory` - Any Azure AD organization
     - `Accounts in any organizational directory and personal Microsoft accounts` - **Recommended for broadest access**
   - **Redirect URI**:
     - Platform: `Web`
     - URI: `https://mps-prod-639787407261.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
4. Click **Register**

### 1.3 Note the Application Details

After registration, note down these values (you'll need them later):
- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 1.4 Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Add a description: `MPS Cognito Integration`
4. Choose expiration: `24 months` (recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again)
   - This is your **Client Secret**

### 1.5 Configure API Permissions

1. Go to **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Select these permissions:
   - `openid`
   - `profile`
   - `email`
6. Click **Add permissions**
7. Click **Grant admin consent for [Your Organization]** (if you have admin rights)

## Step 2: Configure AWS Cognito

### 2.1 Add Microsoft as Identity Provider

Run these AWS CLI commands (replace placeholders with your values):

```bash
# Set your values
MICROSOFT_CLIENT_ID="your-azure-app-client-id"
MICROSOFT_CLIENT_SECRET="your-azure-app-client-secret"
USER_POOL_ID="us-east-1_23veUlUUb"

# Add Microsoft as identity provider
aws cognito-idp create-identity-provider \
  --user-pool-id $USER_POOL_ID \
  --provider-name Microsoft \
  --provider-type OIDC \
  --provider-details '{
    "client_id": "'$MICROSOFT_CLIENT_ID'",
    "client_secret": "'$MICROSOFT_CLIENT_SECRET'",
    "authorize_scopes": "openid profile email",
    "oidc_issuer": "https://login.microsoftonline.com/common/v2.0",
    "attributes_request_method": "GET"
  }' \
  --attribute-mapping '{
    "email": "email",
    "name": "name",
    "username": "sub"
  }'
```

### 2.2 Update App Client for OAuth

```bash
# Get current app client settings
aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id 5o8a25t8ki8b2uo6ckponfg4t9

# Update app client to support OAuth with Microsoft
aws cognito-idp update-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id 5o8a25t8ki8b2uo6ckponfg4t9 \
  --supported-identity-providers "COGNITO" "Microsoft" \
  --callback-urls '["https://mps-frontend-qa-app.vercel.app/auth/callback", "http://localhost:3000/auth/callback"]' \
  --logout-urls '["https://mps-frontend-qa-app.vercel.app/login", "http://localhost:3000/login"]' \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client
```

### 2.3 Configure Domain (if not already set)

```bash
# Check if domain exists
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --query 'UserPool.Domain'

# If no domain, create one (use your existing domain)
# Domain is already set: mps-prod-639787407261
```

## Step 3: Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Existing variables (keep these)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_23veUlUUb
NEXT_PUBLIC_COGNITO_CLIENT_ID=5o8a25t8ki8b2uo6ckponfg4t9
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# New variable for OAuth
NEXT_PUBLIC_COGNITO_DOMAIN=mps-prod-639787407261.auth.us-east-1.amazoncognito.com
```

## Step 4: Test the Integration

1. Deploy the updated frontend code
2. Navigate to the login page
3. Click "Sign in with Microsoft"
4. You should be redirected to Microsoft login
5. After authentication, you'll be redirected back to the app
6. A new user account is automatically created

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Azure exactly matches: `https://mps-prod-639787407261.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

### Error: "invalid_client"
- Check that the Client ID and Secret are correct
- Ensure the secret hasn't expired

### User not created in database
- The Lambda trigger should auto-create users on first sign-in
- Check CloudWatch logs for the Pre-Sign-Up or Post-Confirmation trigger

## Security Notes

1. **Client Secret**: Store securely, never commit to git
2. **Token Expiration**: Azure client secrets expire - set calendar reminder
3. **Permissions**: Only request necessary scopes (openid, profile, email)
4. **Audit**: Enable AWS CloudTrail for Cognito events

## Architecture Flow

```
User clicks "Sign in with Microsoft"
    ↓
Redirect to Cognito Hosted UI
    ↓
Cognito redirects to Microsoft login
    ↓
User authenticates with Microsoft
    ↓
Microsoft returns tokens to Cognito
    ↓
Cognito creates/updates user record
    ↓
Redirect to app with authorization code
    ↓
App exchanges code for tokens
    ↓
User is signed in
```
