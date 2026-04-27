'use client'

import { CATEGORIES, CONSOLES } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function MainSidePanelCategories() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  function toggle(slug: string) {
    setOpen((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  const isSearching = search.length > 0
  const filteredConsoles = isSearching
    ? CONSOLES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : CONSOLES

  return (
    <>
      <div className="w-[90%]">
        <input
          type="text"
          placeholder="Buscar consola…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-main text-text-main text-sm px-3 py-2 rounded-xl outline-none placeholder:text-text-secondary"
        />
      </div>

      <ul className="pl-5 w-full flex flex-col gap-3 list-none">
        {CATEGORIES.map((category) => {
          const isOpen = isSearching || !!open[category.slug]
          return (
            <li key={category.slug} className="text-lg">
              <button
                onClick={() => toggle(category.slug)}
                className="flex items-center w-full text-left gap-2 pr-5"
              >
                <span className="transition-transform duration-200 hover:scale-105 inline-block origin-left">
                  {category.label}
                </span>
                <span
                  className={`ml-auto text-gray-400 text-xs transition-transform duration-300 ease-in-out ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  ▼
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <ul
                  className={`overflow-hidden pl-5 flex flex-col gap-1 mt-1 transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {filteredConsoles.length > 0 ? (
                    filteredConsoles.map((con) => (
                      <li key={con.id}>
                        <Link
                          href={`/${category.slug}/${con.id}`}
                          className="flex items-center gap-2 text-base text-gray-400"
                        >
                          <Image
                            src={con.icon}
                            alt={con.name}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                          <span className="transition-transform duration-200 hover:scale-105 inline-block origin-left">
                            {con.name}
                          </span>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-text-secondary pl-1">Sin resultados</li>
                  )}
                </ul>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
