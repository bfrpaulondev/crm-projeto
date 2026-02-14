import { gql } from '@apollo/client';

// Leads query with pagination and filtering
export const GET_LEADS = gql`
  query GetLeads($first: Int, $after: String, $filter: LeadFilterInput) {
    leads(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
          companyName
          status
          source
          score
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
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
      source
      estimatedValue
      notes
      createdAt
      updatedAt
      assignedTo {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

// Dashboard stats
export const GET_DASHBOARD = gql`
  query GetDashboard {
    dashboard {
      totalLeads
      qualifiedLeads
      convertedLeads
      totalOpportunities
      openOpportunities
      totalPipelineValue
      wonValue
      lostValue
    }
  }
`;

// Pipeline with opportunities by stage
export const GET_PIPELINE = gql`
  query GetPipeline {
    pipeline {
      stage
      opportunities {
        id
        name
        value
        stage
        probability
        expectedCloseDate
        assignedTo {
          id
          firstName
          lastName
        }
        lead {
          id
          firstName
          lastName
          company
        }
      }
    }
  }
`;

// Opportunities
export const GET_OPPORTUNITIES = gql`
  query GetOpportunities {
    opportunities {
      id
      name
      amount
      status
      probability
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

// Accounts
export const GET_ACCOUNTS = gql`
  query GetAccounts {
    accounts {
      id
      name
      domain
      website
      createdAt
    }
  }
`;

// Contacts
export const GET_CONTACTS = gql`
  query GetContacts {
    contacts {
      id
      firstName
      lastName
      email
      createdAt
    }
  }
`;

// Lead conversion stats
export const GET_LEAD_CONVERSION_STATS = gql`
  query GetLeadConversionStats {
    leadConversionStats {
      source
      total
      converted
      conversionRate
    }
  }
`;

// Activity stats
export const GET_ACTIVITY_STATS = gql`
  query GetActivityStats {
    activityStats {
      type
      count
      completed
    }
  }
`;
