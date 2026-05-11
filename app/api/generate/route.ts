export async function POST(request: Request) {
  const { prompt } = await request.json()

  if (!prompt) {
    return Response.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_KEY
  if (!apiKey) {
    return Response.json({ error: 'No API key configured' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    if (!res.ok) return Response.json({ error: data }, { status: 500 })

    const text = data.content?.[0]?.text || 'Une erreur est survenue.'
    return Response.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
