import { gql } from '@apollo/client';

// ==========================================
// QUERIES THAT EXIST IN THE DEPLOYED API
// ==========================================

// Get all leads for the current tenant
export const GET_LEADS = gql`
  query GetLeads {
    leads {
      id
      firstName
      lastName
      email
      phone
      companyName
      status
      ownerId
      owner {
        id
        firstName
        lastName
        email
        role
      }
      createdAt
    }
  }
`;

// Get a single lead by ID
export const GET_LEAD = gql`
  query GetLead($id: String!) {
    lead(id: $id) {
      id
      firstName
      lastName
      email
      phone
      companyName
      status
      ownerId
      owner {
        id
        firstName
        lastName
        email
        role
      }
      createdAt
    }
  }
`;

// NOTE: The following queries DO NOT EXIST in the deployed API:
// - opportunities (no Opportunity type)
// - stages (no Stage type)
// - pipeline (doesn't exist)
