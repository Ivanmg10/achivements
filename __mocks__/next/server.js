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

  static json(data, init = {}) {
    const res = new NextResponse(JSON.stringify(data), init)
    res.data = data
    return res
  }

  static redirect(url, init = {}) {
    const res = new NextResponse(null, { status: init.status || 307 })
    res.headers.set('location', String(url))
    res.url = String(url)
    return res
  }
}

module.exports = { NextRequest, NextResponse }
