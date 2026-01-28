/**
 * Health Check API Endpoint
 * Used by Coolify/Docker for container health monitoring
 */

import { NextResponse } from 'next/server'
import { healthCheck as dbHealthCheck } from '@/lib/db'
import { redisHealthCheck } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: boolean
    redis: boolean
  }
}

export async function GET() {
  const startTime = Date.now()
  
  // Run health checks in parallel
  const [dbStatus, redisStatus] = await Promise.all([
    dbHealthCheck().catch(() => false),
    redisHealthCheck().catch(() => false)
  ])

  const allHealthy = dbStatus && redisStatus
  const someHealthy = dbStatus || redisStatus

  const health: HealthStatus = {
    status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: dbStatus,
      redis: redisStatus
    }
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json(health, {
    status: allHealthy ? 200 : someHealthy ? 200 : 503,
    headers: {
      'X-Response-Time': `${responseTime}ms`,
      'Cache-Control': 'no-store'
    }
  })
}
