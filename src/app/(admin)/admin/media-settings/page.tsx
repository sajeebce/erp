'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

function getAdminToken(): string {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('superAdminToken='))
    ?.split('=')[1] || ''
}

function adminFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  }).then(r => {
    if (r.status === 401) {
      window.location.href = '/admin/login'
      throw new Error('Unauthorized')
    }
    return r.json()
  })
}

interface MediaSettings {
  provider: string
  bucketName: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
  maxFileSizeMb: number
}

const defaultSettings: MediaSettings = {
  provider: 'S3',
  bucketName: '',
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: '',
  publicUrl: '',
  maxFileSizeMb: 10,
}

export default function AdminMediaSettingsPage() {
  const [settings, setSettings] = useState<MediaSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    adminFetch('/api/v1/admin/media-settings')
      .then(json => {
        if (json.success && json.data) {
          setSettings({
            provider: json.data.provider || 'S3',
            bucketName: json.data.bucketName || '',
            endpoint: json.data.endpoint || '',
            accessKeyId: json.data.accessKeyId || '',
            secretAccessKey: json.data.secretAccessKey || '',
            publicUrl: json.data.publicUrl || '',
            maxFileSizeMb: json.data.maxFileSizeMb || 10,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await adminFetch('/api/v1/admin/media-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      if (res.success) {
        setMessage({ type: 'success', text: 'Media settings saved successfully.' })
      } else {
        setMessage({ type: 'error', text: res.error?.message || 'Failed to save settings.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setMessage(null)
    try {
      const res = await adminFetch('/api/v1/admin/media-settings/test', {
        method: 'POST',
        body: JSON.stringify(settings),
      })
      if (res.success) {
        setMessage({ type: 'success', text: 'Connection test successful!' })
      } else {
        setMessage({ type: 'error', text: res.error?.message || 'Connection test failed.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Media Settings" description="Configure file storage provider" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Media Settings" description="Configure file storage provider and upload limits" />

      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Storage Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={settings.provider}
              onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S3">Amazon S3</SelectItem>
                <SelectItem value="R2">Cloudflare R2</SelectItem>
                <SelectItem value="MINIO">MinIO</SelectItem>
                <SelectItem value="DO_SPACES">DigitalOcean Spaces</SelectItem>
                <SelectItem value="LOCAL">Local Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucketName">Bucket Name</Label>
            <Input
              id="bucketName"
              placeholder="my-ngo-erp-bucket"
              value={settings.bucketName}
              onChange={(e) => setSettings(prev => ({ ...prev, bucketName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              placeholder="https://s3.amazonaws.com"
              value={settings.endpoint}
              onChange={(e) => setSettings(prev => ({ ...prev, endpoint: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={settings.accessKeyId}
              onChange={(e) => setSettings(prev => ({ ...prev, accessKeyId: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              type="password"
              placeholder="••••••••••••••••"
              value={settings.secretAccessKey}
              onChange={(e) => setSettings(prev => ({ ...prev, secretAccessKey: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicUrl">Public URL</Label>
            <Input
              id="publicUrl"
              placeholder="https://cdn.ngoerp.com"
              value={settings.publicUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, publicUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxFileSizeMb">Max File Size (MB)</Label>
            <Input
              id="maxFileSizeMb"
              type="number"
              min={1}
              max={500}
              value={settings.maxFileSizeMb}
              onChange={(e) => setSettings(prev => ({ ...prev, maxFileSizeMb: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
