import Link from 'next/link';


interface DocsHeaderProps {
  projectLogo?: string;
  projectName: string;
}

export function DocsHeader({ projectLogo, projectName }: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="w-full flex h-[54px] items-center px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            {projectLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={projectLogo} 
                alt={projectName} 
                className="h-8 w-auto object-contain" 
              />
            ) : (
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {projectName}
              </span>
            )}
            
            <div className="h-4 w-[2px] bg-[#D8D8D8]" />
            
            <span className="text-md font-medium text-[#1D2130] hover:text-foreground transition-colors">
              Help Center
            </span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex">
             {/* Search could go here if global, but design shows it in sidebar */}
          </div>
        </div>
      </div>
    </header>
  );
}
