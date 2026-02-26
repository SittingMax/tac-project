'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManifestBuilder } from '@/components/manifests/ManifestBuilder/ManifestBuilder';
import { Button } from '@/components/ui/button';

export default function CreateManifestPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // Handle modal closing - redirect back to list
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      navigate('/manifests');
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-muted/20 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Build Manifest</h1>
        <p className="text-muted-foreground">
          Use the enterprise AWB-first workflow to build a manifest.
        </p>
        <Button onClick={() => setOpen(true)}>Open Builder</Button>
      </div>

      <ManifestBuilder open={open} onOpenChange={onOpenChange} />
    </div>
  );
}
