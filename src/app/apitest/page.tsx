"use client";

import { useEffect, useState } from "react";

export default function ApiTest() {
  const [data, setData] = useState<object | null>(null);
  useEffect(() => {
    fetch("/api/getUserProfile")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  return (
    <main className="min-h-screen">
      <p className="main-content">Api Test</p>
      {data ? (
        <p className="main-content">{JSON.stringify(data)}</p>
      ) : (
        <p>No data</p>
      )}
    </main>
  );
}
