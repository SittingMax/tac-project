import React from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { Search, ScanBarcode } from "lucide-react"

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useStore } from "@/store"
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler"
import { NotificationBell } from "../domain/NotificationBell"
import { useScanner } from "@/context/useScanner"
import { CommandPalette } from "../domain/CommandPalette"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

export const Header: React.FC = () => {
  const { setTheme } = useStore()
  const { scan } = useScanner()
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = React.useState(false)

  const handleManualScan = async () => {
    try {
      const result = await scan()
      const cleanResult = result.trim().toUpperCase()
      if (!cleanResult) return

      if (cleanResult.startsWith("TAC")) {
        navigate(`/finance?awb=${encodeURIComponent(cleanResult)}`)
        return
      }

      if (cleanResult.startsWith("MAN")) {
        navigate(`/manifests?search=${encodeURIComponent(cleanResult)}`)
        return
      }

      navigate(`/search?q=${encodeURIComponent(cleanResult)}`)
    } catch {
      // Scan cancelled
    }
  }

  const paths = location.pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {paths.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1
                const href = `/${paths.slice(0, index + 1).join("/")}`
                const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ")

                return (
                  <React.Fragment key={path}>
                    <BreadcrumbItem className="hidden md:block">
                      {isLast ? (
                        <BreadcrumbPage>{formattedPath}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={href}>{formattedPath}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4 max-w-md">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden lg:flex w-full max-w-[300px] items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:shadow-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left text-sm">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <button
          onClick={handleManualScan}
          className="p-2 rounded-none text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all"
          title="Scan QR/Barcode"
        >
          <ScanBarcode className="h-5 w-5" />
        </button>

        <AnimatedThemeToggler
          className="text-muted-foreground hover:text-primary rounded-none hover:bg-primary/15 transition-all"
          duration={500}
          onThemeChange={setTheme}
        />

        <NotificationBell />
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}
