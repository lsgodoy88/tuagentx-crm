import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const AUDIT_SECRET = process.env.AUDIT_SECRET

const LIMITES = {
  ram_porcentaje: { optimo: 60, aceptable: 80 },
  swap_gb: { optimo: 0.1, aceptable: 0.5 },
  cpu_porcentaje: { optimo: 40, aceptable: 70 },
  load_avg: { optimo: 1.0, aceptable: 2.0 },
  redis_hit_rate: { optimo: 80, aceptable: 60 },
  nginx_conexiones: { optimo: 100, aceptable: 500 },
  pg_query_ms: { optimo: 100, aceptable: 500 },
  pm2_ram_mb: {
    panel: { optimo: 300, aceptable: 500 },
    gestor: { optimo: 150, aceptable: 300 },
    'gestor-worker': { optimo: 100, aceptable: 200 },
    master: { optimo: 150, aceptable: 300 },
  }
}

function clasificar(valor: number, optimo: number, aceptable: number, invertido = false) {
  if (invertido) {
    if (valor >= optimo) return { estado: 'OPTIMO', color: 'verde' }
    if (valor >= aceptable) return { estado: 'ACEPTABLE', color: 'amarillo' }
    return { estado: 'CRITICO', color: 'rojo' }
  }
  if (valor <= optimo) return { estado: 'OPTIMO', color: 'verde' }
  if (valor <= aceptable) return { estado: 'ACEPTABLE', color: 'amarillo' }
  return { estado: 'CRITICO', color: 'rojo' }
}

async function getRam() {
  const { stdout } = await execAsync("free -m | awk 'NR==2{print $2,$3,$4}'")
  const [total, usado, libre] = stdout.trim().split(' ').map(Number)
  const porcentaje = Math.round((usado / total) * 100)
  const eval_ = clasificar(porcentaje, LIMITES.ram_porcentaje.optimo, LIMITES.ram_porcentaje.aceptable)
  return {
    total_mb: total, usado_mb: usado, libre_mb: libre, porcentaje,
    optimo_porcentaje: LIMITES.ram_porcentaje.optimo,
    aceptable_porcentaje: LIMITES.ram_porcentaje.aceptable,
    estado: eval_.estado, color: eval_.color,
    delta: porcentaje <= LIMITES.ram_porcentaje.optimo
      ? `${LIMITES.ram_porcentaje.optimo - porcentaje}% bajo el optimo`
      : `${porcentaje - LIMITES.ram_porcentaje.optimo}% sobre el optimo`,
  }
}

async function getSwap() {
  const { stdout } = await execAsync("free -m | awk 'NR==3{print $2,$3}'")
  const [total, usado] = stdout.trim().split(' ').map(Number)
  const usado_gb = Math.round((usado / 1024) * 100) / 100
  const eval_ = clasificar(usado_gb, LIMITES.swap_gb.optimo, LIMITES.swap_gb.aceptable)
  return {
    total_mb: total, usado_mb: usado, usado_gb,
    optimo_gb: LIMITES.swap_gb.optimo,
    estado: eval_.estado, color: eval_.color,
    nota: usado_gb > LIMITES.swap_gb.optimo
      ? 'Swap en uso indica presion de memoria RAM — considerar upgrade'
      : 'Sin presion de memoria',
  }
}

async function getCpu() {
  const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'")
  const cpu = parseFloat(stdout.trim())
  const eval_ = clasificar(cpu, LIMITES.cpu_porcentaje.optimo, LIMITES.cpu_porcentaje.aceptable)
  return {
    porcentaje: cpu,
    optimo_porcentaje: LIMITES.cpu_porcentaje.optimo,
    aceptable_porcentaje: LIMITES.cpu_porcentaje.aceptable,
    estado: eval_.estado, color: eval_.color,
    delta: cpu <= LIMITES.cpu_porcentaje.optimo
      ? `${Math.round(LIMITES.cpu_porcentaje.optimo - cpu)}% bajo el optimo`
      : `${Math.round(cpu - LIMITES.cpu_porcentaje.optimo)}% sobre el optimo`,
  }
}

async function getLoadAverage() {
  const { stdout } = await execAsync("cat /proc/loadavg")
  const parts = stdout.trim().split(' ')
  const load1 = parseFloat(parts[0])
  const load5 = parseFloat(parts[1])
  const load15 = parseFloat(parts[2])
  const { stdout: cpus } = await execAsync("nproc")
  const nucleos = parseInt(cpus.trim())
  const load_por_nucleo = Math.round((load1 / nucleos) * 100) / 100
  const eval_ = clasificar(load1, LIMITES.load_avg.optimo * nucleos, LIMITES.load_avg.aceptable * nucleos)
  return {
    load_1min: load1,
    load_5min: load5,
    load_15min: load15,
    nucleos_cpu: nucleos,
    load_por_nucleo,
    optimo: `< ${LIMITES.load_avg.optimo * nucleos} para ${nucleos} nucleos`,
    aceptable: `< ${LIMITES.load_avg.aceptable * nucleos} para ${nucleos} nucleos`,
    estado: eval_.estado, color: eval_.color,
    tendencia: load1 > load5 ? 'SUBIENDO' : load1 < load5 ? 'BAJANDO' : 'ESTABLE',
    nota: load_por_nucleo > 1
      ? `Servidor saturado — ${load_por_nucleo}x carga por nucleo`
      : load_por_nucleo > 0.7
      ? `Carga alta pero manejable — ${load_por_nucleo}x por nucleo`
      : `Carga normal — ${load_por_nucleo}x por nucleo`,
  }
}

async function getRedis() {
  try {
    const { stdout } = await execAsync("docker exec redis redis-cli info stats 2>/dev/null || redis-cli info stats 2>/dev/null || echo 'ERROR'")
    if (stdout.includes('ERROR')) return { disponible: false, nota: 'Redis no accesible via CLI' }

    const get = (key: string) => {
      const match = stdout.match(new RegExp(key + ':(\d+)'))
      return match ? parseInt(match[1]) : 0
    }

    const hits = get('keyspace_hits')
    const misses = get('keyspace_misses')
    const total = hits + misses
    const hit_rate = total > 0 ? Math.round((hits / total) * 100) : 100
    const comandos_por_segundo = get('instantaneous_ops_per_sec')
    const conexiones = get('connected_clients')
    const eval_ = clasificar(hit_rate, LIMITES.redis_hit_rate.optimo, LIMITES.redis_hit_rate.aceptable, true)

    const { stdout: mem } = await execAsync("docker exec redis redis-cli info memory 2>/dev/null | grep used_memory_human || echo 'used_memory_human:N/A'")
    const memoria = mem.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'N/A'

    const { stdout: keys } = await execAsync("docker exec redis redis-cli dbsize 2>/dev/null || echo '0'")

    return {
      disponible: true,
      hit_rate_porcentaje: hit_rate,
      hits_total: hits,
      misses_total: misses,
      optimo_hit_rate: LIMITES.redis_hit_rate.optimo,
      aceptable_hit_rate: LIMITES.redis_hit_rate.aceptable,
      estado: eval_.estado, color: eval_.color,
      memoria_usada: memoria,
      keys_total: parseInt(keys.trim()) || 0,
      conexiones_activas: conexiones,
      comandos_por_segundo,
      nota: hit_rate < LIMITES.redis_hit_rate.aceptable
        ? 'Hit rate bajo — cache ineficiente, revisar TTL y estrategia de cacheo'
        : hit_rate < LIMITES.redis_hit_rate.optimo
        ? 'Hit rate aceptable — hay margen de mejora en estrategia de cache'
        : 'Cache funcionando correctamente',
    }
  } catch {
    return { disponible: false, nota: 'Error al consultar Redis' }
  }
}

async function getNginxConexiones() {
  try {
    const { stdout } = await execAsync("curl -s http://localhost/nginx_status 2>/dev/null || echo 'ERROR'")
    if (stdout.includes('ERROR') || !stdout.includes('Active connections')) {
      const { stdout: ss } = await execAsync("ss -tn | grep ':80\|:443' | wc -l")
      const conexiones = parseInt(ss.trim())
      const eval_ = clasificar(conexiones, LIMITES.nginx_conexiones.optimo, LIMITES.nginx_conexiones.aceptable)
      return {
        fuente: 'ss',
        conexiones_activas: conexiones,
        optimo: LIMITES.nginx_conexiones.optimo,
        aceptable: LIMITES.nginx_conexiones.aceptable,
        estado: eval_.estado, color: eval_.color,
        nota: conexiones > LIMITES.nginx_conexiones.aceptable
          ? 'Trafico muy alto — posible ataque o pico inusual'
          : conexiones > LIMITES.nginx_conexiones.optimo
          ? 'Trafico elevado — monitorear'
          : 'Trafico normal',
      }
    }
    const activas = parseInt(stdout.match(/Active connections:\s+(\d+)/)?.[1] || '0')
    const eval_ = clasificar(activas, LIMITES.nginx_conexiones.optimo, LIMITES.nginx_conexiones.aceptable)
    return {
      fuente: 'nginx_status',
      conexiones_activas: activas,
      optimo: LIMITES.nginx_conexiones.optimo,
      aceptable: LIMITES.nginx_conexiones.aceptable,
      estado: eval_.estado, color: eval_.color,
      nota: activas > LIMITES.nginx_conexiones.aceptable
        ? 'Trafico muy alto — posible ataque o pico inusual'
        : 'Trafico normal',
    }
  } catch {
    return { disponible: false, nota: 'Error al consultar nginx' }
  }
}

async function getPostgresQuerysLentas() {
  try {
    const { stdout } = await execAsync(`docker exec postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo 'ERROR'`)
    if (stdout.includes('ERROR')) return { disponible: false, nota: 'Postgres no accesible' }

    const conexiones_activas = parseInt(stdout.trim()) || 0

    const { stdout: slow } = await execAsync(`docker exec postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 second';" 2>/dev/null || echo '0'`)
    const queries_lentas = parseInt(slow.trim()) || 0

    const { stdout: db_size } = await execAsync(`docker exec postgres psql -U postgres -t -c "SELECT pg_size_pretty(sum(pg_database_size(datname))) FROM pg_database;" 2>/dev/null || echo 'N/A'`)

    const eval_ = clasificar(queries_lentas, 0, 3)

    return {
      disponible: true,
      conexiones_activas,
      queries_lentas_ahora: queries_lentas,
      tamano_total_db: db_size.trim(),
      estado: eval_.estado, color: eval_.color,
      nota: queries_lentas > 3
        ? `${queries_lentas} queries lentas activas — revisar indices y joins pesados`
        : queries_lentas > 0
        ? `${queries_lentas} query(ies) lenta(s) — monitorear`
        : 'Sin queries lentas — base de datos respondiendo bien',
    }
  } catch {
    return { disponible: false, nota: 'Error al consultar Postgres' }
  }
}

async function getDisco() {
  const { stdout } = await execAsync("df -h /srv | awk 'NR==2{print $2,$3,$4,$5}'")
  const [total, usado, libre, porcentaje] = stdout.trim().split(' ')
  const pct = parseInt(porcentaje)
  const eval_ = clasificar(pct, 60, 80)
  return {
    total, usado, libre, porcentaje,
    estado: eval_.estado, color: eval_.color,
    nota: pct > 80 ? 'Disco critico — limpiar logs y builds antiguos'
      : pct > 60 ? 'Disco en zona aceptable — monitorear'
      : 'Disco en buen estado',
  }
}

async function getPm2() {
  const { stdout } = await execAsync("pm2 jlist 2>/dev/null")
  const procesos = JSON.parse(stdout)
  return procesos.map((p: any) => {
    const nombre = p.name as keyof typeof LIMITES.pm2_ram_mb
    const ram_mb = Math.round(p.monit?.memory / 1024 / 1024) || 0
    const cpu = p.monit?.cpu || 0
    const limites = LIMITES.pm2_ram_mb[nombre] || { optimo: 200, aceptable: 400 }
    const eval_ = clasificar(ram_mb, limites.optimo, limites.aceptable)
    return {
      nombre: p.name,
      status: p.pm2_env?.status,
      reinicios: p.pm2_env?.restart_time || 0,
      uptime_horas: Math.round((Date.now() - (p.pm2_env?.pm_uptime || 0)) / 3600000),
      ram_mb,
      optimo_ram_mb: limites.optimo,
      aceptable_ram_mb: limites.aceptable,
      cpu_porcentaje: cpu,
      estado_ram: eval_.estado,
      color: eval_.color,
      delta_ram: ram_mb <= limites.optimo
        ? `${limites.optimo - ram_mb}MB bajo el optimo`
        : `+${ram_mb - limites.optimo}MB sobre el optimo`,
      alerta: p.pm2_env?.restart_time > 5
        ? `Reiniciado ${p.pm2_env.restart_time} veces — posible crash loop`
        : null,
    }
  })
}

async function getDocker() {
  const { stdout } = await execAsync("docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.PIDs}}' 2>/dev/null || echo ''")
  if (!stdout.trim()) return []
  return stdout.trim().split('\n').map(linea => {
    const [nombre, cpu, mem_usage, mem_perc, pids] = linea.split(',')
    const mem_num = parseFloat(mem_perc)
    const eval_ = clasificar(mem_num, 60, 80)
    return { nombre, cpu, memoria: mem_usage, memoria_porcentaje: mem_perc, pids, estado: eval_.estado, color: eval_.color }
  })
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-audit-secret')
  if (secret !== AUDIT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [ram, swap, cpu, load, redis, nginx, postgres, disco, pm2, docker] = await Promise.all([
    getRam(), getSwap(), getCpu(), getLoadAverage(),
    getRedis(), getNginxConexiones(), getPostgresQuerysLentas(),
    getDisco(), getPm2(), getDocker()
  ])

  const alertas = [
    ...(load.estado === 'CRITICO' ? [`Load average critico: ${load.load_1min} — servidor saturado`] : []),
    ...(redis.disponible && (redis as any).estado === 'CRITICO' ? [`Redis hit rate critico: ${(redis as any).hit_rate_porcentaje}%`] : []),
    ...(postgres.disponible && (postgres as any).queries_lentas_ahora > 3 ? [`${(postgres as any).queries_lentas_ahora} queries lentas en Postgres`] : []),
    ...(nginx.disponible !== false && (nginx as any).estado === 'CRITICO' ? [`Conexiones nginx criticas: ${(nginx as any).conexiones_activas}`] : []),
    ...pm2.filter((p: any) => p.estado_ram === 'CRITICO').map((p: any) => `RAM critica en ${p.nombre}: ${p.ram_mb}MB`),
    ...pm2.filter((p: any) => p.alerta).map((p: any) => p.alerta),
    ...(ram.estado === 'CRITICO' ? [`RAM del servidor critica: ${ram.porcentaje}%`] : []),
    ...(disco.estado === 'CRITICO' ? [`Disco critico: ${disco.porcentaje}`] : []),
  ]

  const scores = [
    ram.estado === 'OPTIMO' ? 100 : ram.estado === 'ACEPTABLE' ? 70 : 30,
    cpu.estado === 'OPTIMO' ? 100 : cpu.estado === 'ACEPTABLE' ? 70 : 30,
    load.estado === 'OPTIMO' ? 100 : load.estado === 'ACEPTABLE' ? 70 : 30,
    disco.estado === 'OPTIMO' ? 100 : disco.estado === 'ACEPTABLE' ? 70 : 30,
    redis.disponible && (redis as any).estado === 'OPTIMO' ? 100 : redis.disponible && (redis as any).estado === 'ACEPTABLE' ? 70 : 85,
    postgres.disponible && (postgres as any).estado === 'OPTIMO' ? 100 : postgres.disponible && (postgres as any).estado === 'ACEPTABLE' ? 70 : 85,
  ]
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    score: `${score}/100`,
    accion_requerida: alertas.length > 0,
    resumen: alertas.length > 0
      ? `${alertas.length} alerta(s) de rendimiento detectadas`
      : 'Rendimiento del servidor en estado optimo',
    servidor: { ram, swap, cpu, load_average: load, disco },
    bases_de_datos: { redis, postgres },
    red: { nginx },
    pm2,
    docker,
    alertas,
  })
}
