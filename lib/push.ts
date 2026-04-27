export async function enviarPush(userIds: string[] | null, titulo: string, cuerpo: string, url?: string) {
  try {
    await fetch('http://localhost:3000/api/push/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal': 'push' },
      body: JSON.stringify({ userIds, titulo, cuerpo, url })
    })
  } catch(e) {
    console.log('Error enviando push:', e)
  }
}
