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
      relatedToType
      relatedToId
      lead {
        id
        firstName
        lastName
        email
        companyName
      }
      ownerId
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
      relatedToType
      relatedToId
      lead {
        id
        firstName
        lastName
        email
        companyName
      }
      ownerId
      createdAt
      updatedAt
    }
  }
`;
