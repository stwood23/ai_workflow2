/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

export default function SignUpPage() {
  const { theme } = useTheme()

  return (
    <SignUp
      forceRedirectUrl="/prompts"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  )
}
