class NextRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || "GET";
    this._body = init.body || null;
    this.headers = new Map(Object.entries(init.headers || {}));
    try {
      const parsed = new URL(url);
      this.nextUrl = parsed;
      this.nextUrl.searchParams = parsed.searchParams;
    } catch {
      this.nextUrl = { searchParams: new URLSearchParams() };
    }
  }

  async json() {
    return JSON.parse(this._body);
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
  }

  static json(data, init = {}) {
    const res = new NextResponse(JSON.stringify(data), init);
    res.data = data;
    return res;
  }
}

module.exports = { NextRequest, NextResponse };
