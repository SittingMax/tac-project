import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Upload, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  type: 'AIR' | 'SURFACE' | 'CUSTOM';
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
}

const defaultTemplates: LabelTemplate[] = [
  {
    id: 'air-standard',
    name: 'Air Cargo - Standard',
    description: 'Standard air cargo label with plane icon',
    type: 'AIR',
    isDefault: true,
    createdAt: '2026-01-01',
    usageCount: 1245,
  },
  {
    id: 'surface-standard',
    name: 'Surface Cargo - Standard',
    description: 'Standard surface cargo label with truck icon',
    type: 'SURFACE',
    isDefault: true,
    createdAt: '2026-01-01',
    usageCount: 2341,
  },
];

export const LabelTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<LabelTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSetDefault = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault:
          t.id === templateId
            ? true
            : t.type === templates.find((x) => x.id === templateId)?.type
              ? false
              : t.isDefault,
      }))
    );
    toast.success('Default template updated');
  };

  const handleDuplicate = (template: LabelTemplate) => {
    const newTemplate: LabelTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    toast.success('Template duplicated');
  };

  const handleDelete = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template?.isDefault) {
      toast.error('Cannot delete default template');
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    toast.success('Template deleted');
  };

  const handleExport = (template: LabelTemplate) => {
    const data = JSON.stringify(template, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.json`;
    a.click();
    toast.success('Template exported');
  };

  const handleImport = () => {
    toast.info('Import functionality coming soon');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Label Templates</h2>
          <p className="text-muted-foreground">Manage shipping label templates and layouts</p>
        </div>
        <Button onClick={handleImport}>
          <Upload className="w-4 h-4 mr-2" />
          Import Template
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="air">Air Cargo</TabsTrigger>
          <TabsTrigger value="surface">Surface</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="default" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-medium">{template.usageCount.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(template.id);
                          }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(template);
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="air" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter((t) => t.type === 'AIR')
              .map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="surface" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter((t) => t.type === 'SURFACE')
              .map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No custom templates yet</p>
            <Button className="mt-4" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import Custom Template
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabelTemplateManager;
