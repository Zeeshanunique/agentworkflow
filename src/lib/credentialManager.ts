// N8n-style Credentials Management System
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Credential types supported by the system
export interface ICredentialType {
  name: string;
  displayName: string;
  description: string;
  properties: ICredentialProperty[];
  authenticate?: {
    type: 'oauth2' | 'apiKey' | 'basic';
    properties: Record<string, any>;
  };
}

export interface ICredentialProperty {
  displayName: string;
  name: string;
  type: 'string' | 'password' | 'number' | 'boolean' | 'json';
  required?: boolean;
  default?: any;
  description?: string;
  placeholder?: string;
  options?: Array<{
    name: string;
    value: string;
  }>;
}

// Stored credential data (encrypted in real implementation)
export interface ICredentialData {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Credential store state
interface CredentialState {
  credentials: ICredentialData[];
  credentialTypes: Record<string, ICredentialType>;
  
  // Actions
  addCredential: (credential: Omit<ICredentialData, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCredential: (id: string, updates: Partial<ICredentialData>) => void;
  deleteCredential: (id: string) => void;
  getCredential: (id: string) => ICredentialData | undefined;
  getCredentialsByType: (type: string) => ICredentialData[];
  registerCredentialType: (type: ICredentialType) => void;
  testCredential: (id: string) => Promise<boolean>;
}

// Define common credential types
const defaultCredentialTypes: Record<string, ICredentialType> = {
  openaiApi: {
    name: 'openaiApi',
    displayName: 'OpenAI API',
    description: 'Credentials for OpenAI API access',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'Your OpenAI API key',
        placeholder: 'sk-...'
      },
      {
        displayName: 'Organization ID',
        name: 'organizationId',
        type: 'string',
        required: false,
        description: 'Optional organization ID',
        placeholder: 'org-...'
      }
    ]
  },
  
  httpBasicAuth: {
    name: 'httpBasicAuth',
    displayName: 'HTTP Basic Auth',
    description: 'Basic authentication credentials',
    properties: [
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username for authentication'
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
        description: 'Password for authentication'
      }
    ]
  },

  oauth2Api: {
    name: 'oauth2Api',
    displayName: 'OAuth2 API',
    description: 'OAuth2 authentication credentials',
    properties: [
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
        description: 'OAuth2 client ID'
      },
      {
        displayName: 'Client Secret',
        name: 'clientSecret',
        type: 'password',
        required: true,
        description: 'OAuth2 client secret'
      },
      {
        displayName: 'Access Token',
        name: 'accessToken',
        type: 'password',
        required: false,
        description: 'Access token (if available)'
      },
      {
        displayName: 'Refresh Token',
        name: 'refreshToken',
        type: 'password',
        required: false,
        description: 'Refresh token (if available)'
      }
    ]
  },

  emailCredentials: {
    name: 'emailCredentials',
    displayName: 'Email Credentials',
    description: 'Email server credentials',
    properties: [
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        required: true,
        description: 'Email server host',
        placeholder: 'smtp.gmail.com'
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        required: true,
        default: 587,
        description: 'Email server port'
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        required: true,
        description: 'Email username'
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
        description: 'Email password or app password'
      },
      {
        displayName: 'Secure',
        name: 'secure',
        type: 'boolean',
        default: true,
        description: 'Use secure connection (TLS)'
      }
    ]
  },

  databaseCredentials: {
    name: 'databaseCredentials',
    displayName: 'Database Credentials',
    description: 'Database connection credentials',
    properties: [
      {
        displayName: 'Database Type',
        name: 'type',
        type: 'string',
        required: true,
        options: [
          { name: 'MySQL', value: 'mysql' },
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'Redis', value: 'redis' }
        ],
        description: 'Type of database'
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        required: true,
        default: 'localhost',
        description: 'Database host'
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        required: true,
        description: 'Database port'
      },
      {
        displayName: 'Database Name',
        name: 'database',
        type: 'string',
        required: true,
        description: 'Database name'
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        required: true,
        description: 'Database username'
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
        description: 'Database password'
      }
    ]
  }
};

// Create the credential store
export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      credentialTypes: defaultCredentialTypes,

      addCredential: (credential) => {
        const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        const newCredential: ICredentialData = {
          ...credential,
          id,
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({
          credentials: [...state.credentials, newCredential]
        }));

        return id;
      },

      updateCredential: (id, updates) => {
        set((state) => ({
          credentials: state.credentials.map((cred) =>
            cred.id === id
              ? { ...cred, ...updates, updatedAt: new Date() }
              : cred
          )
        }));
      },

      deleteCredential: (id) => {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.id !== id)
        }));
      },

      getCredential: (id) => {
        return get().credentials.find((cred) => cred.id === id);
      },

      getCredentialsByType: (type) => {
        return get().credentials.filter((cred) => cred.type === type && cred.isActive);
      },

      registerCredentialType: (type) => {
        set((state) => ({
          credentialTypes: {
            ...state.credentialTypes,
            [type.name]: type
          }
        }));
      },

      testCredential: async (id) => {
        const credential = get().getCredential(id);
        if (!credential) {
          return false;
        }

        try {
          // Implement credential testing logic based on type
          switch (credential.type) {
            case 'openaiApi':
              // Test OpenAI API key
              const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                  'Authorization': `Bearer ${credential.data.apiKey}`,
                  'Content-Type': 'application/json'
                }
              });
              return response.ok;

            case 'httpBasicAuth':
              // Basic auth doesn't have a universal test endpoint
              return true;

            default:
              return true;
          }
        } catch (error) {
          console.error('Credential test failed:', error);
          return false;
        }
      }
    }),
    {
      name: 'n8n-credentials-storage',
      // In a real implementation, this should be encrypted
      partialize: (state) => ({
        credentials: state.credentials,
        credentialTypes: state.credentialTypes
      })
    }
  )
);

// Helper functions for credential management
export function createCredential(
  name: string,
  type: string,
  data: Record<string, any>
): string {
  const store = useCredentialStore.getState();
  return store.addCredential({
    name,
    type,
    data,
    isActive: true
  });
}

export function getCredentialData(id: string): Record<string, any> | null {
  const store = useCredentialStore.getState();
  const credential = store.getCredential(id);
  return credential ? credential.data : null;
}

export function getAllCredentialTypes(): Record<string, ICredentialType> {
  const store = useCredentialStore.getState();
  return store.credentialTypes;
}

export function validateCredentialData(
  type: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const store = useCredentialStore.getState();
  const credentialType = store.credentialTypes[type];
  
  if (!credentialType) {
    return { valid: false, errors: [`Unknown credential type: ${type}`] };
  }

  const errors: string[] = [];

  for (const property of credentialType.properties) {
    const value = data[property.name];
    
    // Check required fields
    if (property.required && (value === undefined || value === null || value === '')) {
      errors.push(`${property.displayName} is required`);
    }

    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      switch (property.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${property.displayName} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${property.displayName} must be a boolean`);
          }
          break;
        case 'json':
          if (typeof value === 'string') {
            try {
              JSON.parse(value);
            } catch {
              errors.push(`${property.displayName} must be valid JSON`);
            }
          }
          break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
