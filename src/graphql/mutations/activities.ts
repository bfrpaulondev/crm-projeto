import { gql } from '@apollo/client';

// Create a new activity
export const CREATE_ACTIVITY_MUTATION = gql`
  mutation CreateActivity(
    $type: ActivityType!
    $subject: String!
    $description: String
    $priority: ActivityPriority
    $dueDate: DateTime
    $leadId: String
    $assignedToId: String
  ) {
    createActivity(
      type: $type
      subject: $subject
      description: $description
      priority: $priority
      dueDate: $dueDate
      leadId: $leadId
      assignedToId: $assignedToId
    ) {
      id
      type
      subject
      description
      status
      priority
      dueDate
      leadId
      assignedToId
      createdAt
    }
  }
`;

// Update an existing activity
export const UPDATE_ACTIVITY_MUTATION = gql`
  mutation UpdateActivity(
    $id: String!
    $type: ActivityType
    $subject: String
    $description: String
    $status: ActivityStatus
    $priority: ActivityPriority
    $dueDate: DateTime
    $leadId: String
    $assignedToId: String
  ) {
    updateActivity(
      id: $id
      type: $type
      subject: $subject
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
      leadId: $leadId
      assignedToId: $assignedToId
    ) {
      id
      type
      subject
      description
      status
      priority
      dueDate
      leadId
      assignedToId
      updatedAt
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
      status
      completedAt
    }
  }
`;

// Bulk update activity status
export const BULK_UPDATE_ACTIVITY_STATUS_MUTATION = gql`
  mutation BulkUpdateActivityStatus($ids: [String!]!, $status: ActivityStatus!) {
    bulkUpdateActivityStatus(ids: $ids, status: $status) {
      success
      processedCount
      successCount
      failedCount
    }
  }
`;
