"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, X, Loader2, ImageIcon, FileIcon } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export interface Attachment {
  name: string
  url: string
  contentType: string
}

export interface AIChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void
  isLoading: boolean
  placeholder?: string
  projectId?: string
  allowAttachments?: boolean
}

export function AIChatInput({ 
  onSend, 
  isLoading, 
  placeholder = "Skriv ditt meddelande...",
  projectId,
  allowAttachments = true
}: AIChatInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !projectId) {
      if (!projectId) toast.error("Projekt-ID saknas för filuppladdning")
      return
    }

    const file = files[0]
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen är för stor", { description: "Max filstorlek är 10MB" })
      return
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'text/csv', 'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Filtypen stöds inte", { description: "Stöder bilder, PDF, text, CSV och Office-dokument" })
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData, error: urlError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(filePath, 3600)

      if (urlError || !urlData) throw urlError || new Error("Kunde inte hämta URL för filen")

      setAttachments(prev => [...prev, {
        name: file.name,
        url: urlData.signedUrl,
        contentType: file.type
      }])
      toast.success("Fil bifogad", { description: file.name })
    } catch (error: any) {
      console.error('File upload error:', error)
      toast.error("Kunde inte ladda upp filen", { description: error.message })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return
    
    onSend(inputValue, attachments)
    setInputValue("")
    setAttachments([])
  }

  return (
    <div className="p-4 border-t bg-background shrink-0 space-y-2">
      {allowAttachments && (
        <>
          <div className="text-[10px] leading-tight text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded px-2 py-1.5">
            <strong>⚠️ GDPR:</strong> Ladda ej upp känsliga personuppgifter. Filer raderas automatiskt efter 24 timmar.
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs border">
                  {att.contentType.startsWith('image/') ? (
                    <ImageIcon className="h-3 w-3 text-blue-500" />
                  ) : (
                    <FileIcon className="h-3 w-3 text-gray-500" />
                  )}
                  <span className="max-w-[150px] truncate">{att.name}</span>
                  <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.txt,.csv,.json,.xlsx,.xls,.docx,.doc"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading || !projectId}
              title="Bifoga fil"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
          </>
        )}

        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1"
          autoComplete="off"
        />
        
        <Button type="submit" size="icon" disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}


