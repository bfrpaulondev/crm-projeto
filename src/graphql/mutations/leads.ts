import { gql } from '@apollo/client';

// ==========================================
// MUTATIONS THAT EXIST IN THE DEPLOYED API
// ==========================================

// createLead: accepts firstName, lastName, email, phone, companyName
// Returns: id, email, status
export const CREATE_LEAD_MUTATION = gql`
  mutation CreateLead(
    $firstName: String!
    $lastName: String!
    $email: String!
    $phone: String
    $companyName: String
  ) {
    createLead(
      firstName: $firstName
      lastName: $lastName
      email: $email
      phone: $phone
      companyName: $companyName
    ) {
      id
      email
      status
    }
  }
`;

// updateLead: accepts id, firstName, lastName, email, phone, companyName
// Returns: id, firstName, lastName, email, status
export const UPDATE_LEAD_MUTATION = gql`
  mutation UpdateLead(
    $id: String!
    $firstName: String
    $lastName: String
    $email: String
    $phone: String
    $companyName: String
  ) {
    updateLead(
      id: $id
      firstName: $firstName
      lastName: $lastName
      email: $email
      phone: $phone
      companyName: $companyName
    ) {
      id
      firstName
      lastName
      email
      status
    }
  }
`;

// deleteLead: accepts id, returns Boolean
export const DELETE_LEAD_MUTATION = gql`
  mutation DeleteLead($id: String!) {
    deleteLead(id: $id)
  }
`;

// qualifyLead: accepts id, returns id and status
export const QUALIFY_LEAD_MUTATION = gql`
  mutation QualifyLead($id: String!) {
    qualifyLead(id: $id) {
      id
      status
    }
  }
`;

// convertLead: accepts leadId and createOpportunity (optional)
// Returns: leadId, contactId, accountId, opportunityId
export const CONVERT_LEAD_MUTATION = gql`
  mutation ConvertLead($leadId: String!, $createOpportunity: Boolean) {
    convertLead(leadId: $leadId, createOpportunity: $createOpportunity) {
      leadId
      contactId
      accountId
      opportunityId
    }
  }
`;

// bulkDeleteLeads: accepts ids array
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

// createWebhook: accepts name, url, events
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

// deleteWebhook: accepts id, returns Boolean
export const DELETE_WEBHOOK_MUTATION = gql`
  mutation DeleteWebhook($id: String!) {
    deleteWebhook(id: $id)
  }
`;

// assignLead: accepts leadId and ownerId
export const ASSIGN_LEAD_MUTATION = gql`
  mutation AssignLead($leadId: String!, $ownerId: String!) {
    assignLead(leadId: $leadId, ownerId: $ownerId) {
      id
      ownerId
      owner {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

// NOTE: The following mutations DO NOT EXIST in the deployed API:
// - updateLead (use qualifyLead or convertLead to change status)
// - createOpportunity
// - updateOpportunityStage
