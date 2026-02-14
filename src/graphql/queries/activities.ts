import { gql } from '@apollo/client';

// Get all activities for the current tenant
export const GET_ACTIVITIES = gql`
  query GetActivities {
    activities {
      id
      type
      subject
      description
      status
      priority
      dueDate
      completedAt
      leadId
      lead {
        id
        firstName
        lastName
        email
        companyName
      }
      assignedToId
      assignedTo {
        id
        firstName
        lastName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// Get a single activity by ID
export const GET_ACTIVITY = gql`
  query GetActivity($id: String!) {
    activity(id: $id) {
      id
      type
      subject
      description
      status
      priority
      dueDate
      completedAt
      leadId
      lead {
        id
        firstName
        lastName
        email
        companyName
      }
      assignedToId
      assignedTo {
        id
        firstName
        lastName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// Get activities by lead ID
export const GET_LEAD_ACTIVITIES = gql`
  query GetLeadActivities($leadId: String!) {
    activitiesByLead(leadId: $leadId) {
      id
      type
      subject
      description
      status
      priority
      dueDate
      completedAt
      createdAt
      updatedAt
    }
  }
`;

// Get activities by date range (for calendar)
export const GET_ACTIVITIES_BY_DATE_RANGE = gql`
  query GetActivitiesByDateRange($startDate: DateTime!, $endDate: DateTime!) {
    activitiesByDateRange(startDate: $startDate, endDate: $endDate) {
      id
      type
      subject
      description
      status
      priority
      dueDate
      leadId
      lead {
        id
        firstName
        lastName
      }
      createdAt
    }
  }
`;
