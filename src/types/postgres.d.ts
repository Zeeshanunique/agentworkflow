declare module 'postgres' {
  interface PostgresConfig {
    host?: string;
    port?: number;
    path?: string;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idle_timeout?: number;
    connect_timeout?: number;
    prepare?: boolean;
    types?: any;
    onnotice?: (notice: any) => void;
    onparameter?: (parameterStatus: any) => void;
    debug?: (connection: any, query: any, parameters: any) => void;
    transform?: { column?: {}, value?: {}, row?: {} };
    connection?: { application_name?: string, [key: string]: any };
    [key: string]: any;
  }

  interface PostgresConnection {
    // Core query method
    (query: string | TemplateStringsArray, ...args: any[]): Promise<any[]>;

    // Methods
    begin: (options?: { savepoint?: boolean, isolation_level?: string }) => PostgresTransaction;
    end: () => Promise<void>;
    
    // Properties
    unsafe: PostgresConnection;
    array: (array: any[], type?: string) => any;
    file: (path: string) => any;
    json: (value: any) => any;
    notify: (channel: string, payload?: string) => Promise<void>;
    subscribe: (channel: string, callback: (payload: string) => void) => { unsubscribe: () => void };
  }

  interface PostgresTransaction extends PostgresConnection {
    savepoint: () => PostgresTransaction;
    commit: () => Promise<void>;
    rollback: (savepoint?: string) => Promise<void>;
  }

  function postgres(connectionString: string, config?: PostgresConfig): PostgresConnection;
  
  export = postgres;
}
