"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addTransaction } from "@/actions/database"
import type { Project } from "@/lib/types/database"

const formSchema = z.object({
  amount: z.coerce
    .number({
      required_error: "Antal krediter krävs",
      invalid_type_error: "Måste vara ett nummer",
    })
    .int("Antal krediter måste vara ett heltal"),
  description: z.string().min(1, "Beskrivning krävs").max(255, "Beskrivningen är för lång"),
  projectId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TopUpCreditsDialogProps {
  orgId: string
  orgName: string
  projects?: Project[]
}

export function TopUpCreditsDialog({ orgId, orgName, projects = [] }: TopUpCreditsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      projectId: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const result = await addTransaction({
        orgId,
        amount: values.amount,
        description: values.description,
        projectId: values.projectId || null,
      })

      if (result.success) {
        if (values.amount === 0) {
          toast({
            title: "Transaktion registrerad",
            description: `Nolltransaktion sparad för ${orgName}.`,
          })
        } else {
          const isNegative = values.amount < 0
          const actionText = isNegative ? "korrigerade" : "tillagda"
          const amountDisplay = Math.abs(values.amount)
          
          toast({
            title: `Krediter ${actionText}`,
            description: `${isNegative ? '-' : '+'}${amountDisplay} krediter för ${orgName}.`,
          })
        }
        setOpen(false)
        form.reset()
      } else {
        console.log("Transaction error:", result.error)
        toast({
          variant: "destructive",
          title: "Otillräckligt saldo",
          description: result.error || "Kunde inte uppdatera krediter. Försök igen.",
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
    // Always reset form when dialog state changes
    if (!newOpen) {
      // Dialog is closing - reset everything
      setTimeout(() => {
        form.reset()
        setIsSubmitting(false)
      }, 100)
    } else {
      // Dialog is opening - ensure clean state
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Hantera krediter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Hantera krediter</DialogTitle>
          <DialogDescription>
            Lägg till eller korrigera krediter för <span className="font-semibold">{orgName}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antal krediter</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="t.ex. 10000 eller -500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Positivt lägger till, negativt drar av. Saldo kan inte bli negativt.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivning</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Faktura #1234 eller Korrigering fel debitering" {...field} />
                  </FormControl>
                  <FormDescription>
                    Beskriv anledningen till transaktionen (visas i historiken)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {projects.length > 0 && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projekt (valfritt)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj projekt (eller lämna tomt)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Koppla transaktionen till ett projekt för bättre spårning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setOpen(false)
                }}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sparar..." : "Spara transaktion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

