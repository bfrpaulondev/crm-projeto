import { gql } from '@apollo/client';

// Invite a new user to the tenant
export const INVITE_USER_MUTATION = gql`
  mutation InviteUser(
    $email: String!
    $firstName: String!
    $lastName: String!
    $role: String!
    $password: String
  ) {
    inviteUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      role: $role
      password: $password
    ) {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

// Update a user
export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $id: String!
    $firstName: String
    $lastName: String
    $role: String
  ) {
    updateUser(
      id: $id
      firstName: $firstName
      lastName: $lastName
      role: $role
    )
  }
`;

// Delete a user
export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;
