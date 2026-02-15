import { gql } from '@apollo/client';

// Create a new activity
export const CREATE_ACTIVITY_MUTATION = gql`
  mutation CreateActivity(
    $type: String!
    $subject: String!
    $description: String
    $priority: String
    $dueDate: String
    $relatedToType: String
    $relatedToId: String
  ) {
    createActivity(
      type: $type
      subject: $subject
      description: $description
      priority: $priority
      dueDate: $dueDate
      relatedToType: $relatedToType
      relatedToId: $relatedToId
    ) {
      id
    }
  }
`;

// Update an existing activity
export const UPDATE_ACTIVITY_MUTATION = gql`
  mutation UpdateActivity(
    $id: String!
    $subject: String
    $description: String
    $status: String
    $priority: String
    $dueDate: String
  ) {
    updateActivity(
      id: $id
      subject: $subject
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
    ) {
      id
    }
  }
`;

// Delete an activity
export const DELETE_ACTIVITY_MUTATION = gql`
  mutation DeleteActivity($id: String!) {
    deleteActivity(id: $id)
  }
`;

// Complete an activity
export const COMPLETE_ACTIVITY_MUTATION = gql`
  mutation CompleteActivity($id: String!) {
    completeActivity(id: $id) {
      id
    }
  }
`;
