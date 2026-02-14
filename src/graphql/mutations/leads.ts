import { gql } from '@apollo/client';

// Updated to match deployed API - uses individual arguments instead of input type
export const CREATE_LEAD_MUTATION = gql`
  mutation CreateLead(
    $firstName: String!
    $lastName: String!
    $email: String!
    $phone: String
    $companyName: String
    $status: String
    $notes: String
  ) {
    createLead(
      firstName: $firstName
      lastName: $lastName
      email: $email
      phone: $phone
      companyName: $companyName
      status: $status
      notes: $notes
    ) {
      id
      firstName
      lastName
      email
      phone
      companyName
      status
      notes
      createdAt
    }
  }
`;

// Update lead mutation - individual arguments
export const UPDATE_LEAD_MUTATION = gql`
  mutation UpdateLead(
    $id: String!
    $firstName: String
    $lastName: String
    $email: String
    $phone: String
    $companyName: String
    $status: String
    $notes: String
  ) {
    updateLead(
      id: $id
      firstName: $firstName
      lastName: $lastName
      email: $email
      phone: $phone
      companyName: $companyName
      status: $status
      notes: $notes
    ) {
      id
      firstName
      lastName
      email
      phone
      companyName
      status
      notes
      updatedAt
    }
  }
`;

// Delete lead mutation
export const DELETE_LEAD_MUTATION = gql`
  mutation DeleteLead($id: String!) {
    deleteLead(id: $id)
  }
`;

// Qualify lead - try with individual args
export const QUALIFY_LEAD_MUTATION = gql`
  mutation QualifyLead($id: String!) {
    qualifyLead(id: $id) {
      id
      status
    }
  }
`;

// Convert lead - try with individual args
export const CONVERT_LEAD_MUTATION = gql`
  mutation ConvertLead($id: String!) {
    convertLead(id: $id) {
      id
      status
    }
  }
`;

export const UPDATE_OPPORTUNITY_STAGE_MUTATION = gql`
  mutation UpdateOpportunityStage($id: String!, $stage: String!) {
    updateOpportunityStage(id: $id, stage: $stage) {
      id
      stage
      updatedAt
    }
  }
`;

export const BULK_DELETE_LEADS_MUTATION = gql`
  mutation BulkDeleteLeads($ids: [String!]!) {
    bulkDeleteLeads(ids: $ids) {
      success
      processedCount
      successCount
      failedCount
      errors {
        index
        error
      }
    }
  }
`;

export const CREATE_WEBHOOK_MUTATION = gql`
  mutation CreateWebhook($name: String!, $url: String!, $events: [String!]!) {
    createWebhook(name: $name, url: $url, events: $events) {
      id
      name
      url
      isActive
    }
  }
`;

export const DELETE_WEBHOOK_MUTATION = gql`
  mutation DeleteWebhook($id: String!) {
    deleteWebhook(id: $id)
  }
`;

export const CREATE_OPPORTUNITY_MUTATION = gql`
  mutation CreateOpportunity(
    $name: String!
    $amount: Float
    $stage: String
    $probability: Int
    $expectedCloseDate: String
    $leadId: String
    $accountId: String
  ) {
    createOpportunity(
      name: $name
      amount: $amount
      stage: $stage
      probability: $probability
      expectedCloseDate: $expectedCloseDate
      leadId: $leadId
      accountId: $accountId
    ) {
      id
      name
      amount
      stage
      probability
      createdAt
    }
  }
`;
