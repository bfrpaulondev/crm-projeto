import { gql } from '@apollo/client';

// Get all users for the current tenant
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

// Get a single user by ID
export const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

// Get current user
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`;
