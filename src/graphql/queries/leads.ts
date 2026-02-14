import { gql } from '@apollo/client';

// Simple leads query - matches deployed API
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
      createdAt
    }
  }
`;

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
      notes
      createdAt
      updatedAt
    }
  }
`;

// Simple opportunities query
export const GET_OPPORTUNITIES = gql`
  query GetOpportunities {
    opportunities {
      id
      name
      amount
      stage
      status
      probability
      expectedCloseDate
      createdAt
    }
  }
`;

// Stages for pipeline
export const GET_STAGES = gql`
  query GetStages {
    stages {
      id
      name
      order
      probability
    }
  }
`;
