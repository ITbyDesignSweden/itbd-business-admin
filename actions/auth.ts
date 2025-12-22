"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Translate common Supabase auth errors to Swedish
    let errorMessage = error.message
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Ogiltiga inloggningsuppgifter"
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "E-postadressen är inte bekräftad"
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Ogiltig e-postadress"
    } else if (error.message.includes("Password should be at least")) {
      errorMessage = "Lösenordet måste vara minst 6 tecken"
    } else {
      errorMessage = "Något gick fel vid inloggning"
    }
    return { error: errorMessage }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

