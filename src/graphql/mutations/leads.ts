import { gql } from '@apollo/client';

// ==========================================
// LEAD MUTATIONS
// ==========================================

// createLead: accepts firstName, lastName, email, phone, companyName
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

// NOTE: updateLead mutation needs to be deployed to the API
// For now, editing will show a message that it's not available
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
