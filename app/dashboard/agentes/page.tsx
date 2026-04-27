'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AgentesPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/bots') }, [])
  return null
}
