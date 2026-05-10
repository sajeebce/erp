'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Loader2, Mail, Save, Send, Settings } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmailSettings {
  smtpServer: string
  smtpPort: number
  smtpSecurity: string
  smtpUsername: string
  smtpAppPassword: string
  fromAddress: string
  fromName: string
  dailySendLimit: number
}

interface MailTemplate {
  key: string
  subject: string
  body: string
}

interface QueueSummary {
  status: string
  count: number
}

const TEMPLATE_LABELS: Record<string, string> = {
  APPLICATION_RECEIVED: 'Application received',
  RECRUITMENT_SCREENED: 'Recruitment: Screened',
  RECRUITMENT_SHORTLISTED: 'Recruitment: Shortlisted',
  RECRUITMENT_TECHNICAL_TEST: 'Recruitment: Technical Test',
  RECRUITMENT_INTERVIEW: 'Recruitment: Interview',
  RECRUITMENT_REFERENCE_CHECK: 'Recruitment: Reference Check',
  RECRUITMENT_OFFER: 'Recruitment: Offer',
  RECRUITMENT_HIRED: 'Recruitment: Hired',
  ONBOARDING_STARTED: 'Onboarding: Started',
  ONBOARDING_COMPLETED: 'Onboarding: Completed',
  OFFBOARDING_STARTED: 'Offboarding: Started',
  OFFBOARDING_COMPLETED: 'Offboarding: Completed',
  PAYROLL_APPROVED: 'Payroll: Approved',
}

const DEFAULT_EMAIL: EmailSettings = {
  smtpServer: '',
  smtpPort: 587,
  smtpSecurity: 'STARTTLS',
  smtpUsername: '',
  smtpAppPassword: '',
  fromAddress: '',
  fromName: '',
  dailySendLimit: 500,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const [email, setEmail] = useState<EmailSettings>(DEFAULT_EMAIL)
  const [templates, setTemplates] = useState<MailTemplate[]>([])
  const [queueSummary, setQueueSummary] = useState<QueueSummary[]>([])
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey) || templates[0],
    [selectedTemplateKey, templates]
  )

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/settings/notifications')
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || 'Failed to load notification settings')
        return
      }

      setEmail({ ...DEFAULT_EMAIL, ...json.data.email })
      setTemplates(json.data.templates || [])
      setQueueSummary(json.data.queueSummary || [])
      setSelectedTemplateKey(json.data.templates?.[0]?.key || '')
    } catch {
      setError('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  function setEmailField<K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) {
    setEmail((current) => ({ ...current, [key]: value }))
  }

  function updateSelectedTemplate(field: keyof Pick<MailTemplate, 'subject' | 'body'>, value: string) {
    if (!selectedTemplate) return
    setTemplates((current) =>
      current.map((template) =>
        template.key === selectedTemplate.key ? { ...template, [field]: value } : template
      )
    )
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/v1/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, templates }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || 'Failed to save notification settings')
        return
      }

      setEmail({ ...DEFAULT_EMAIL, ...json.data.email })
      setTemplates(json.data.templates || [])
      setQueueSummary(json.data.queueSummary || [])
      setMessage('Notification settings saved')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setError('Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  const queueTotal = queueSummary.reduce((sum, item) => sum + item.count, 0)
  const pendingCount = queueSummary.find((item) => item.status === 'PENDING')?.count || 0
  const sentCount = queueSummary.find((item) => item.status === 'SENT')?.count || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notification Settings" description="Configure SMTP and HR email templates" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Configure Gmail SMTP, mail queue, and HR stage templates"
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </PageHeader>

      {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SMTP Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-semibold">{email.smtpServer ? 'Configured' : 'Not set'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{email.smtpServer || 'Gmail SMTP not configured yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Email Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-semibold">{pendingCount}</span>
              <span className="text-sm text-muted-foreground">pending</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{sentCount} sent, {queueTotal} total queued</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-500" />
              <span className="text-2xl font-semibold">{templates.length}</span>
              <span className="text-sm text-muted-foreground">active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recruitment, onboarding, offboarding, payroll</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp"><Settings className="h-4 w-4" />SMTP</TabsTrigger>
          <TabsTrigger value="templates"><Mail className="h-4 w-4" />HR Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Email / SMTP Configuration</CardTitle>
              <CardDescription>For Gmail, use smtp.gmail.com, port 587, STARTTLS, and a Gmail app password.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SMTP Server">
                <Input value={email.smtpServer} onChange={(event) => setEmailField('smtpServer', event.target.value)} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="SMTP Port">
                <Input type="number" value={email.smtpPort} onChange={(event) => setEmailField('smtpPort', Number(event.target.value))} />
              </Field>
              <Field label="Encryption">
                <SearchableSelect
                  id="notification-smtp-security"
                  value={email.smtpSecurity}
                  onValueChange={(value) => setEmailField('smtpSecurity', value)}
                  options={[
                    { value: 'STARTTLS', label: 'STARTTLS' },
                    { value: 'SSL', label: 'SSL/TLS' },
                    { value: 'NONE', label: 'None' },
                  ]}
                />
              </Field>
              <Field label="Gmail Username">
                <Input type="email" value={email.smtpUsername} onChange={(event) => setEmailField('smtpUsername', event.target.value)} placeholder="your.email@gmail.com" />
              </Field>
              <Field label="Gmail App Password">
                <Input type="password" value={email.smtpAppPassword} onChange={(event) => setEmailField('smtpAppPassword', event.target.value)} placeholder="16-character app password" />
              </Field>
              <Field label="From Address">
                <Input type="email" value={email.fromAddress} onChange={(event) => setEmailField('fromAddress', event.target.value)} placeholder="hr@example.org" />
              </Field>
              <Field label="From Name">
                <Input value={email.fromName} onChange={(event) => setEmailField('fromName', event.target.value)} placeholder="CSS BD HR" />
              </Field>
              <Field label="Daily Send Limit">
                <Input type="number" min={1} value={email.dailySendLimit} onChange={(event) => setEmailField('dailySendLimit', Number(event.target.value))} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Stage Templates</CardTitle>
                <CardDescription>Each event uses these default subject and body templates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(template.key)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${selectedTemplate?.key === template.key ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  >
                    <span className="font-medium">{TEMPLATE_LABELS[template.key] || template.key}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{template.key}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{selectedTemplate ? TEMPLATE_LABELS[selectedTemplate.key] || selectedTemplate.key : 'Template'}</CardTitle>
                    <CardDescription>Available variables use double braces, for example <code>{'{{applicantName}}'}</code>.</CardDescription>
                  </div>
                  {selectedTemplate && <Badge variant="outline">{selectedTemplate.key}</Badge>}
                </div>
              </CardHeader>
              {selectedTemplate && (
                <CardContent className="space-y-4">
                  <Field label="Subject">
                    <Input value={selectedTemplate.subject} onChange={(event) => updateSelectedTemplate('subject', event.target.value)} />
                  </Field>
                  <Field label="Body">
                    <Textarea className="min-h-72" value={selectedTemplate.body} onChange={(event) => updateSelectedTemplate('body', event.target.value)} />
                  </Field>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
