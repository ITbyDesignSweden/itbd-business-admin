"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileCode } from "lucide-react"

interface BlueprintViewerProps {
  projectTitle: string
  orgName: string
  blueprint: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BlueprintViewer({
  projectTitle,
  orgName,
  blueprint,
  open,
  onOpenChange,
}: BlueprintViewerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl w-full p-0 flex flex-col h-screen">
        {/* Header - Fast höjd */}
        <SheetHeader className="p-6 border-b bg-white dark:bg-slate-900 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            {projectTitle}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{orgName}</p>
        </SheetHeader>

        {/* Bakgrundsyta - flex-1 gör att den tar upp resten av skärmen */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-hidden flex flex-col">
          {/*
             Den vita rutan.
             h-full tillsammans med overflow-hidden på föräldern
             tvingar rutan att stanna inom skärmens gränser.
          */}
          <div className="mx-auto w-full max-w-3xl h-full flex flex-col rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <ScrollArea className="flex-1 h-full">
              <div className="p-8 md:p-12">
                <div className="prose prose-slate dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:pb-4 prose-h1:border-b prose-h1:mt-0
                  prose-h2:text-xl prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:shadow-inner
                  prose-table:border prose-table:rounded-lg prose-table:overflow-hidden
                  ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {blueprint}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}