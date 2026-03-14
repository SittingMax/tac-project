const fs = require('fs');
let code = fs.readFileSync('c:/logi/tac-portal/components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx', 'utf8');

// Replace standard Label
code = code.replace(/<Label>/g, '<Label className="text-xs font-mono text-muted-foreground uppercase">');

// Replace Labels with newlines
code = code.replace(/<Label>\n\s*Origin/g, '<Label className="text-xs font-mono text-muted-foreground uppercase">\n                  Origin');
code = code.replace(/<Label>\n\s*Destination/g, '<Label className="text-xs font-mono text-muted-foreground uppercase">\n                  Destination');
code = code.replace(/<Label>\n\s*Flight Number/g, '<Label className="text-xs font-mono text-muted-foreground uppercase">\n                      Flight Number');
code = code.replace(/<Label>\n\s*Vehicle Number/g, '<Label className="text-xs font-mono text-muted-foreground uppercase">\n                    Vehicle Number');

// Replace standard Input (without cn)
code = code.replace(/<Input\n?\s*placeholder="([^"]+)"\n?\s*\{\.\.\.form\.register\('([^']+)'\)\}\n?\s*\/>/g, '<Input\n                      placeholder="$1"\n                      {...form.register(\'$2\')}\n                      className="h-11 bg-transparent hover:border-ring/50 transition-colors"\n                    />');
// Single line standard input
code = code.replace(/<Input placeholder="([^"]+)" \{\.\.\.form\.register\('([^']+)'\)\} \/>/g, '<Input placeholder="$1" {...form.register(\'$2\')} className="h-11 bg-transparent hover:border-ring/50 transition-colors" />');


// Replace Input with className
code = code.replace(/<Input\n?\s*placeholder="([^"]+)"\n?\s*\{\.\.\.form\.register\('([^']+)'\)\}\n?\s*className="uppercase font-mono"\n?\s*maxLength=\{3\}\n?\s*\/>/g, '<Input\n                      placeholder="$1"\n                      {...form.register(\'$2\')}\n                      className="h-11 bg-transparent hover:border-ring/50 transition-colors uppercase font-mono"\n                      maxLength={3}\n                    />');

code = code.replace(/className=\{cn\(\n\s*'uppercase font-mono',/g, 'className={cn(\n                      \'h-11 bg-transparent hover:border-ring/50 transition-colors uppercase font-mono\',');

code = code.replace(/className=\{cn\(\n\s*'font-mono',/g, 'className={cn(\n                        \'h-11 bg-transparent hover:border-ring/50 transition-colors font-mono\',');

// Date picker buttons
code = code.replace(/className=\{cn\(\n\s*'w-full justify-start text-left font-normal h-10',/g, 'className={cn(\n                          \'w-full justify-start text-left font-normal h-11 bg-transparent hover:border-ring/50 transition-colors\',');

// SelectTrigger without cn
code = code.replace(/<SelectTrigger className="flex-1">/g, '<SelectTrigger className="flex-1 h-11 bg-transparent hover:border-ring/50 transition-colors">');

// SelectTrigger with cn
code = code.replace(/className=\{cn\(form\.formState\.errors\.fromHubId && 'border-destructive'\)\}/g, 'className={cn(\'h-11 bg-transparent hover:border-ring/50 transition-colors\', form.formState.errors.fromHubId && \'border-destructive\')}');

code = code.replace(/className=\{cn\(form\.formState\.errors\.toHubId && 'border-destructive'\)\}/g, 'className={cn(\'h-11 bg-transparent hover:border-ring/50 transition-colors\', form.formState.errors.toHubId && \'border-destructive\')}');

fs.writeFileSync('c:/logi/tac-portal/components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx', code);
