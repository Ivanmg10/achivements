class NextRequest {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this._body = init.body || null
    this.headers = new Map(Object.entries(init.headers || {}))
    try {
      const parsed = new URL(url)
      this.nextUrl = {
        pathname: parsed.pathname,
        search: parsed.search,
        searchParams: parsed.searchParams,
        href: parsed.href,
      }
    } catch {
      this.nextUrl = { searchParams: new URLSearchParams() }
    }
  }

  async json() {
    return JSON.parse(this._body)
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
  }

  /** Lets the request through, as the real one does in middleware. */
  static next() {
    return new NextResponse(null, { status: 200 })
  }

  static json(data, init = {}) {
    const res = new NextResponse(JSON.stringify(data), init)
    res.data = data
    return res
  }

  static redirect(url, init = {}) {
    const res = new NextResponse(null, { status: init.status || 307, headers: init.headers })
    res.headers.set('location', String(url))
    res.url = String(url)
    return res
  }
}

/**
 * Runs the task at once, as the real one does once the response is sent.
 * Tests await after.pending to see its effects.
 */
function after(task) {
  after.pending.push(Promise.resolve(typeof task === 'function' ? task() : task))
}
after.pending = []

module.exports = { NextRequest, NextResponse, after }
