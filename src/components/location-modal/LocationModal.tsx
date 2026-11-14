'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import Notice from '@/components/ui/Notice'
import CountryList from '@/components/country-list/CountryList'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import { searchCountries } from '@/utils/countries'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentCode?: string | null
}

export default function LocationModal({ isOpen, onClose, currentCode }: Props) {
  const { T, lang } = useLanguage()
  const { save, saving, error, clearError } = useSaveProfileField()
  const [search, setSearch] = useState('')

  const countries = searchCountries(search, lang)

  const handleClose = () => {
    setSearch('')
    clearError()
    onClose()
  }

  const handleSelect = async (code: string) => {
    if (await save('location', code)) handleClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title={T.userData.location}
      toolbar={
        <>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T.userData.searchCountry}
            aria-label={T.userData.searchCountry}
            autoFocus
          />
          {error && <Notice tone="danger">{error}</Notice>}
        </>
      }
    >
      <CountryList countries={countries} value={currentCode} onPick={handleSelect} empty={T.userData.noResults} disabled={saving} />
    </Modal>
  )
}
