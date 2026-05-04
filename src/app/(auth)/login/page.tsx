'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Landmark, Eye, EyeOff, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const DEMO_ORG_SLUG = 'cssbd'
const DEMO_PASSWORD = 'SecurePass@2026!'

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', label: 'Admin', email: 'rahim@cssbd.org' },
  { role: 'STAFF', label: 'Staff', email: 'kamal@cssbd.org' },
  { role: 'STORE_MANAGER', label: 'Store Manager', email: 'shakil@cssbd.org' },
  { role: 'PROGRAM_COORDINATOR', label: 'Program Coordinator', email: 'program@cssbd.org' },
  { role: 'FINANCE_MANAGER', label: 'Finance Manager', email: 'finance@cssbd.org' },
  { role: 'EXECUTIVE_DIRECTOR', label: 'Executive Director', email: 'ed@cssbd.org' },
  { role: 'PROJECT_MANAGER', label: 'Project Manager', email: 'fatema@cssbd.org' },
]

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedRole, setCopiedRole] = useState('')

  async function applyDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    setOrgSlug(DEMO_ORG_SLUG)
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setError('')

    try {
      await navigator.clipboard.writeText(
        `Organization: ${DEMO_ORG_SLUG}\nEmail: ${account.email}\nPassword: ${DEMO_PASSWORD}`
      )
      setCopiedRole(account.role)
      window.setTimeout(() => setCopiedRole(''), 1500)
    } catch {
      setCopiedRole('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const normalizedOrgSlug = orgSlug.trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, orgSlug: normalizedOrgSlug }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || t('login.loginFailed'))
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError(t('login.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Landmark className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="orgSlug">{t('login.orgLabel')}</Label>
            <div className="flex items-center gap-0">
              <Input
                id="orgSlug"
                placeholder={t('login.orgPlaceholder')}
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                className="rounded-r-none"
                required
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground h-9">
                .ngoerp.com
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('login.passwordLabel')}</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                {t('login.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t('login.demoAccount')}</p>
                <p className="text-xs text-muted-foreground">
                  {DEMO_ORG_SLUG} / {DEMO_PASSWORD}
                </p>
              </div>
              <Copy className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => {
                const copied = copiedRole === account.role

                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => applyDemoAccount(account)}
                    className="flex min-h-14 items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 hover:bg-primary/5"
                    aria-label={`Copy ${account.label} login credentials`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{account.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
                    </span>
                    {copied ? (
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('login.signIn')}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t('login.noAccount')}{' '}
            <span className="cursor-not-allowed font-medium text-muted-foreground opacity-60" aria-disabled="true">
              {t('login.createOrg')}
            </span>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
