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
      title
      website
      industry
      status
      source
      score
      notes
      tags
      createdAt
      updatedAt
    }
  }
`;

// Opportunities with pagination
export const GET_OPPORTUNITIES = gql`
  query GetOpportunities($first: Int, $after: String, $filter: OpportunityFilterInput) {
    opportunities(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          name
          amount
          stage
          status
          probability
          expectedCloseDate
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalCount
      }
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
