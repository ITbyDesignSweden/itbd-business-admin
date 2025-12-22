"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { updateProject } from "@/actions/database"
import type { Project } from "@/lib/types/database"

const formSchema = z.object({
  title: z.string().min(1, "Projekttitel krävs").max(255, "Titeln är för lång"),
  status: z.enum(["backlog", "in_progress", "completed", "cancelled"], {
    required_error: "Status krävs",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface EditProjectDialogProps {
  project: Project
}

export function EditProjectDialog({ project }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project.title,
      status: project.status,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const result = await updateProject({
        id: project.id,
        orgId: project.org_id,
        title: values.title,
        status: values.status,
      })

      if (result.success) {
        toast({
          title: "Projekt uppdaterat",
          description: `"${values.title}" har uppdaterats.`,
        })
        setOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Kunde inte uppdatera projekt",
          description: result.error || "Försök igen.",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Något gick fel",
        description: "Ett oväntat fel uppstod. Försök igen.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        form.reset({
          title: project.title,
          status: project.status,
        })
        setIsSubmitting(false)
      }, 100)
    } else {
      form.reset({
        title: project.title,
        status: project.status,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Redigera projekt</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redigera projekt</DialogTitle>
          <DialogDescription>
            Uppdatera information för <span className="font-semibold">{project.title}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projekttitel</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Ny webbplats" {...field} />
                  </FormControl>
                  <FormDescription>Ett beskrivande namn för projektet</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="in_progress">Pågående</SelectItem>
                      <SelectItem value="completed">Klar</SelectItem>
                      <SelectItem value="cancelled">Avbruten</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Projektets nuvarande status</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({
                    title: project.title,
                    status: project.status,
                  })
                  setOpen(false)
                }}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sparar..." : "Spara ändringar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

