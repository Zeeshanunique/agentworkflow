// Credential Management UI Component
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Key, Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useCredentialStore, ICredentialType, ICredentialData, validateCredentialData, getAllCredentialTypes } from '../lib/credentialManager';

interface CredentialManagerProps {
  className?: string;
}

export function CredentialManager({ className = '' }: CredentialManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<ICredentialData | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'failed'>>({});

  const {
    credentials,
    addCredential,
    updateCredential,
    deleteCredential,
    testCredential
  } = useCredentialStore();

  const credentialTypes = getAllCredentialTypes();

  const handleCreateCredential = () => {
    setSelectedCredential(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditCredential = (credential: ICredentialData) => {
    setSelectedCredential(credential);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCredential = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.getAttribute('data-id');
    if (id && confirm('Are you sure you want to delete this credential?')) {
      deleteCredential(id);
    }
  };

  const handleTestCredential = async (id: string) => {
    setTestResults(prev => ({ ...prev, [id]: 'testing' }));
    
    try {
      const success = await testCredential(id);
      setTestResults(prev => ({ 
        ...prev, 
        [id]: success ? 'success' : 'failed' 
      }));
      
      // Clear result after 3 seconds
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[id];
          return newResults;
        });
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const togglePasswordVisibility = (credentialId: string, fieldName: string) => {
    const key = `${credentialId}_${fieldName}`;
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getTestIcon = (credentialId: string) => {
    const result = testResults[credentialId];
    switch (result) {
      case 'testing':
        return <TestTube className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Credentials</h2>
          <p className="text-muted-foreground">
            Manage your API keys and authentication credentials
          </p>
        </div>
        <Button onClick={handleCreateCredential}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Credentials List */}
      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No credentials configured</h3>
              <p className="text-gray-500 mb-4">
                Add your first credential to start using authenticated services
              </p>
              <Button onClick={handleCreateCredential}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </CardContent>
          </Card>
        ) : (
          credentials.map((credential) => {
            const credentialType = credentialTypes[credential.type];
            return (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Key className="h-5 w-5" />
                        <span>{credential.name}</span>
                        <Badge variant={credential.isActive ? 'default' : 'secondary'}>
                          {credential.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {credentialType?.displayName || credential.type}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestCredential(credential.id)}
                        disabled={testResults[credential.id] === 'testing'}
                      >
                        {getTestIcon(credential.id)}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCredential(credential)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteCredential}
                        data-id={credential.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {credentialType?.properties.map((property) => (
                      <div key={property.name} className="flex justify-between items-center">
                        <Label className="text-sm font-medium">
                          {property.displayName}
                        </Label>
                        <div className="flex items-center space-x-2">
                          {property.type === 'password' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {showPasswords[`${credential.id}_${property.name}`]
                                  ? credential.data[property.name] || '••••••••'
                                  : '••••••••'
                                }
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(credential.id, property.name)}
                              >
                                {showPasswords[`${credential.id}_${property.name}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm">
                              {credential.data[property.name] || '-'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 pt-2">
                      Created: {new Date(credential.createdAt).toLocaleDateString()}
                      {credential.updatedAt !== credential.createdAt && (
                        <> • Updated: {new Date(credential.updatedAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Credential Dialog */}
      <CredentialDialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedCredential(null);
        }}
        credential={selectedCredential}
        credentialTypes={credentialTypes}
        onSave={(credentialData) => {
          if (selectedCredential) {
            updateCredential(selectedCredential.id, credentialData);
          } else {
            addCredential(credentialData);
          }
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedCredential(null);
        }}
      />
    </div>
  );
}

// Credential Creation/Edit Dialog
interface CredentialDialogProps {
  open: boolean;
  onClose: () => void;
  credential?: ICredentialData | null;
  credentialTypes: Record<string, ICredentialType>;
  onSave: (credential: Omit<ICredentialData, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function CredentialDialog({
  open,
  onClose,
  credential,
  credentialTypes,
  onSave
}: CredentialDialogProps) {
  const [formData, setFormData] = useState({
    name: credential?.name || '',
    type: credential?.type || Object.keys(credentialTypes)[0] || '',
    data: credential?.data || {},
    isActive: credential?.isActive ?? true
  });
  const [errors, setErrors] = useState<string[]>([]);

  const selectedType = credentialTypes[formData.type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate credential data
    const validation = validateCredentialData(formData.type, formData.data);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSave(formData);
  };

  const updateFieldValue = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldName]: value
      }
    }));
    // Clear errors when user starts typing
    setErrors([]);
  };

  const renderPropertyInput = (property: any) => {
    switch (property.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 mt-1">
            <Checkbox
              id={property.name}
              checked={formData.data[property.name] || property.default || false}
              onCheckedChange={(checked) => updateFieldValue(property.name, checked)}
            />
            <Label htmlFor={property.name} className="text-sm">
              {property.description}
            </Label>
          </div>
        );
      case 'select':
        return (
          <Select
            value={formData.data[property.name] || property.default || ''}
            onValueChange={(value) => updateFieldValue(property.name, value)}
          >
            {property.options.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </Select>
        );
      case 'json':
        return (
          <Textarea
            id={property.name}
            value={
              typeof formData.data[property.name] === 'object'
                ? JSON.stringify(formData.data[property.name], null, 2)
                : formData.data[property.name] || property.default || ''
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateFieldValue(property.name, parsed);
              } catch {
                updateFieldValue(property.name, e.target.value);
              }
            }}
            placeholder={property.placeholder}
            rows={4}
          />
        );
      default:
        return (
          <Input
            id={property.name}
            type={property.type === 'password' ? 'password' : property.type === 'number' ? 'number' : 'text'}
            value={formData.data[property.name] || property.default || ''}
            onChange={(e) => updateFieldValue(
              property.name, 
              property.type === 'number' ? Number(e.target.value) : e.target.value
            )}
            placeholder={property.placeholder}
            required={property.required}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {credential ? 'Edit Credential' : 'Create New Credential'}
          </DialogTitle>
          <DialogDescription>
            {credential
              ? 'Update the credential information below'
              : 'Add a new credential to authenticate with external services'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Credential Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My API Credential"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Credential Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  type: value,
                  data: {} // Reset data when type changes
                }))}
              >
                {Object.values(credentialTypes).map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.displayName}
                  </option>
                ))}
              </Select>
              {selectedType && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedType.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          {/* Dynamic Fields */}
          {selectedType && (
            <div className="space-y-4">
              <h4 className="font-medium">Credential Details</h4>
              {selectedType.properties.map((property) => (
                <div key={property.name}>
                  <Label htmlFor={property.name}>
                    {property.displayName}
                    {property.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderPropertyInput(property)}
                  
                  {property.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {property.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {credential ? 'Update' : 'Create'} Credential
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CredentialManager;
