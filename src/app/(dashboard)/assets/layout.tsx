import { DemoBanner } from '@/components/shared/demo-banner'

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <DemoBanner />
      {children}
    </div>
  )
}
