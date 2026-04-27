'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

export default function AgenteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  useEffect(() => { router.replace(`/dashboard/bots/${id}`) }, [id])
  return null
}
