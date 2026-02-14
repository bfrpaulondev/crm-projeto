import { gql } from '@apollo/client';

// Invite a new user
export const INVITE_USER_MUTATION = gql`
  mutation InviteUser(
    $email: String!
    $firstName: String!
    $lastName: String!
    $role: UserRole!
  ) {
    inviteUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      role: $role
    ) {
      id
      email
      firstName
      lastName
      role
      createdAt
    }
  }
`;

// Update a user
export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $id: String!
    $firstName: String
    $lastName: String
    $role: UserRole
  ) {
    updateUser(
      id: $id
      firstName: $firstName
      lastName: $lastName
      role: $role
    ) {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

// Delete a user
export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;
