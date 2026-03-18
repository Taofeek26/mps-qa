/**
 * AWS Amplify Configuration for MPS Frontend
 * Configures Cognito authentication with Microsoft SSO support
 */

import { Amplify, type ResourcesConfig } from 'aws-amplify';

// Determine callback URLs based on environment
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const baseUrl = isProduction
  ? 'https://mps-frontend-qa-app.vercel.app'
  : 'http://localhost:3000';

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'mps-prod-639787407261.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [`${baseUrl}/auth/callback`],
          redirectSignOut: [`${baseUrl}/login`],
          responseType: 'code',
          providers: ['Microsoft' as const],
        },
      },
    },
  },
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig, { ssr: true });
}

export default amplifyConfig;
