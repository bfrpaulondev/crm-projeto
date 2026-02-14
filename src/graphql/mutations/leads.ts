import { gql } from '@apollo/client';

export const CREATE_LEAD_MUTATION = gql`
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      success
      message
      lead {
        id
        firstName
        lastName
        email
        phone
        companyName
        status
        source
        notes
        createdAt
      }
    }
  }
`;

export const UPDATE_LEAD_MUTATION = gql`
  mutation UpdateLead($id: String!, $input: UpdateLeadInput!) {
    updateLead(id: $id, input: $input) {
      success
      message
      lead {
        id
        firstName
        lastName
        email
        phone
        companyName
        status
        source
        notes
        updatedAt
      }
    }
  }
`;

export const QUALIFY_LEAD_MUTATION = gql`
  mutation QualifyLead($input: QualifyLeadInput!) {
    qualifyLead(input: $input) {
      success
      message
      lead {
        id
        status
      }
    }
  }
`;

export const CONVERT_LEAD_MUTATION = gql`
  mutation ConvertLead($input: ConvertLeadInput!) {
    convertLead(input: $input) {
      success
      message
      lead {
        id
        status
        convertedToContactId
        convertedToAccountId
        convertedToOpportunityId
      }
    }
  }
`;

export const DELETE_LEAD_MUTATION = gql`
  mutation DeleteLead($id: String!) {
    deleteLead(id: $id)
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
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input) {
      id
      name
      value
      stage
      probability
      createdAt
    }
  }
`;
