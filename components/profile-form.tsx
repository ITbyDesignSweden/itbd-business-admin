"use client"

import { useState } from "react"
import { updateProfile, type UpdateProfileInput } from "@/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { Profile } from "@/lib/types/database"
import { Loader2 } from "lucide-react"

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<UpdateProfileInput>({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateProfile(formData)

      if (result.success) {
        toast({
          title: "Profil uppdaterad",
          description: "Dina ändringar har sparats.",
        })
      } else {
        toast({
          title: "Ett fel uppstod",
          description: result.error || "Kunde inte uppdatera profil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ett fel uppstod",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">Förnamn</Label>
        <Input
          id="first_name"
          type="text"
          value={formData.first_name}
          onChange={(e) =>
            setFormData({ ...formData, first_name: e.target.value })
          }
          placeholder="Ditt förnamn"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_name">Efternamn</Label>
        <Input
          id="last_name"
          type="text"
          value={formData.last_name}
          onChange={(e) =>
            setFormData({ ...formData, last_name: e.target.value })
          }
          placeholder="Ditt efternamn"
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Spara ändringar
      </Button>
    </form>
  )
}

