'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [step, setStep] = useState(1) // 1: org info, 2: admin user
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
  }

  function handleOrgNameChange(name: string) {
    setOrgName(name)
    setOrgSlug(generateSlug(name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPasswordErrors([])
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, orgSlug, fullName, email, password, phone }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.error?.details?.password) {
          setPasswordErrors(data.error.details.password)
        } else {
          setError(data.error?.message || t('register.registrationFailed'))
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError(t('register.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{t('register.title')}</CardTitle>
        <CardDescription>{t('register.description')}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Organization Info */}
              <div className="space-y-2">
                <Label htmlFor="orgName">{t('register.orgName')} <span className="text-destructive">*</span></Label>
                <Input id="orgName" placeholder={t('register.orgNamePlaceholder')} value={orgName} onChange={(e) => handleOrgNameChange(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">{t('register.orgUrl')}</Label>
                <div className="flex items-center gap-0">
                  <Input id="orgSlug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="rounded-r-none" required />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground h-9">.ngoerp.com</span>
                </div>
              </div>

              <Button type="button" className="w-full" onClick={() => setStep(2)} disabled={!orgName || !orgSlug}>
                {t('register.continue')}
              </Button>
            </>
          ) : (
            <>
              {/* Admin User Info */}
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{orgName}</span>
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs h-6" onClick={() => setStep(1)}>{t('register.change')}</Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t('register.fullName')} <span className="text-destructive">*</span></Label>
                <Input id="fullName" placeholder={t('register.fullNamePlaceholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('register.email')} <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder={t('register.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('register.password')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t('register.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.length > 0 && (
                  <ul className="text-xs text-destructive space-y-0.5">
                    {passwordErrors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('register.phone')}</Label>
                <Input id="phone" type="tel" placeholder={t('register.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('register.createOrgTrial')}
              </Button>
            </>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            {t('register.hasAccount')}{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">{t('register.signIn')}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
