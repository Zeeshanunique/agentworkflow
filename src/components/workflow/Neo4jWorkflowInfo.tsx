import { useState, useEffect } from "react";
import { useNeo4jWorkflow } from "../../hooks/useNeo4jWorkflow";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle, XCircle, Database } from "lucide-react";

export function Neo4jWorkflowInfo() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const { checkNeo4jStatus, loading, error } = useNeo4jWorkflow();

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkNeo4jStatus();
      setIsConnected(connected);
    };
    
    checkConnection();
  }, []);

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Neo4j Graph Database</CardTitle>
        </div>
        <CardDescription>
          Workflow storage using graph database technology
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected === null ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isConnected ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Connected</AlertTitle>
            <AlertDescription className="text-green-600">
              Neo4j connection established successfully. You can create and manage graph-based workflows.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-600">
              {error || "Could not connect to Neo4j. Please check your connection details."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => checkNeo4jStatus()} disabled={loading}>
          {loading ? "Checking..." : "Check Connection"}
        </Button>
        <Button variant="default" disabled={!isConnected || loading}>
          Create Neo4j Workflow
        </Button>
      </CardFooter>
    </Card>
  );
} 