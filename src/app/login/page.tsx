"use server"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;
  
  async function authenticate(formData: FormData) {
    "use server"
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/admin",
      })
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect(`/login?error=InvalidCredentials`)
      }
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white border border-[var(--brand-border)] shadow-xl p-8 md:p-10">
        
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Asian Furniture" className="h-16 w-16 mx-auto mb-4 rounded-full object-cover shadow-sm" />
          <h1 className="font-display text-3xl font-bold text-[var(--brand-maroon)]">Admin Access</h1>
          <p className="text-sm text-[var(--brand-muted)] mt-2">Secure portal for Asian Furniture staff.</p>
        </div>

        {params?.error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 mb-6 border border-red-200 text-center">
            Invalid email or password. Please try again.
          </div>
        )}

        <form action={authenticate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              defaultValue="admin@asianfurniture.com"
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition" 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[var(--brand-maroon)] text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[var(--brand-muted)] hover:text-[var(--brand-maroon)] transition">
            &larr; Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}
