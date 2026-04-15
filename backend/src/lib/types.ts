export interface AuthenticatedAdmin {
  id: number;
  username: string;
  displayName: string;
}

export interface AppBindings {
  Variables: {
    admin: AuthenticatedAdmin;
    authMethod: 'cookie' | 'bearer';
  };
}
