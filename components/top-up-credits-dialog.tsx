"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"
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
import { addTransaction } from "@/actions/database"

const formSchema = z.object({
  amount: z.coerce
    .number({
      required_error: "Antal krediter krävs",
      invalid_type_error: "Måste vara ett nummer",
    })
    .positive("Antal krediter måste vara större än 0")
    .int("Antal krediter måste vara ett heltal"),
  description: z.string().min(1, "Beskrivning krävs").max(255, "Beskrivningen är för lång"),
})

type FormValues = z.infer<typeof formSchema>

interface TopUpCreditsDialogProps {
  orgId: string
  orgName: string
}

export function TopUpCreditsDialog({ orgId, orgName }: TopUpCreditsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const result = await addTransaction({
        orgId,
        amount: values.amount,
        description: values.description,
      })

      if (result.success) {
        toast.success("Krediter tillagda!", {
          description: `${values.amount} krediter har lagts till för ${orgName}.`,
        })
        setOpen(false)
        form.reset({
          description: "",
        })
      } else {
        toast.error("Något gick fel", {
          description: result.error || "Kunde inte lägga till krediter. Försök igen.",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Något gick fel", {
        description: "Ett oväntat fel uppstod. Försök igen.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Lägg till krediter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lägg till krediter</DialogTitle>
          <DialogDescription>
            Lägg till krediter för <span className="font-semibold">{orgName}</span>
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
                      placeholder="t.ex. 10000"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>Ange antal krediter som ska läggas till</FormDescription>
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
                    <Input placeholder="t.ex. Faktura #1234 - Top-up" {...field} />
                  </FormControl>
                  <FormDescription>
                    Beskriv anledningen till påfyllningen (visas i transaktionshistoriken)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Lägger till..." : "Lägg till krediter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

