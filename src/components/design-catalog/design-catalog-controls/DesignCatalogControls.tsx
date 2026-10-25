'use client'

import { useState } from 'react'
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import Input, { Field, Textarea } from '@/components/ui/Input'
import SearchInput from '@/components/ui/SearchInput'
import PasswordInput from '@/components/ui/PasswordInput'
import Select from '@/components/ui/Select'
import Switch from '@/components/ui/Switch'
import Checkbox from '@/components/ui/Checkbox'
import ChoiceCards from '@/components/ui/ChoiceCards'
import Tabs from '@/components/ui/Tabs'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Pill from '@/components/ui/Pill'
import DesignCatalogSection, { Specimen } from '../design-catalog-section/DesignCatalogSection'

const VARIANTS = ['primary', 'secondary', 'quiet', 'danger'] as const
const SIZES = ['sm', 'md', 'lg'] as const

/** Buttons, fields and the choosers: everything a person presses, types into or picks from. */
export default function DesignCatalogControls() {
  const [on, setOn] = useState(true)
  const [tick, setTick] = useState(true)
  const [pick, setPick] = useState('b')
  const [tab, setTab] = useState('all')
  const [seg, setSeg] = useState('list')
  const [pill, setPill] = useState(true)
  const [select, setSelect] = useState('week')
  const [password, setPassword] = useState('')

  return (
    <>
      <DesignCatalogSection id="buttons" title="Buttons" hint="Button (primary, secondary, quiet, danger; sm, md, lg; loading; href for a link) and IconButton (needs aria-label).">
        {VARIANTS.map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-3">
            {SIZES.map((s) => (
              <Button key={s} variant={v} size={s}>{v} · {s}</Button>
            ))}
            <Button variant={v} loading>Loading</Button>
            <Button variant={v} disabled>Disabled</Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/design">As a link (href)</Button>
          <IconButton aria-label="Edit"><IconPencil size={16} /></IconButton>
          <IconButton aria-label="Add" tone="accent"><IconPlus size={16} /></IconButton>
          <IconButton aria-label="Delete" tone="danger"><IconTrash size={16} /></IconButton>
          <IconButton aria-label="Pressed" aria-pressed><IconPencil size={16} /></IconButton>
        </div>
      </DesignCatalogSection>

      <DesignCatalogSection id="fields" title="Fields" hint="Input, Textarea, SearchInput and PasswordInput, wrapped in Field (label, aside, hint or error wired by id).">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" aside="Optional" hint="Letters and numbers.">{(c) => <Input placeholder="ivanxmarine" {...c} />}</Field>
          <Field label="Email" error="This address is taken.">{(c) => <Input defaultValue="a@b.c" invalid {...c} />}</Field>
          <Field label="About you" aside="9 / 280">{(c) => <Textarea rows={3} placeholder="Hi World!" {...c} />}</Field>
          <div className="flex flex-col gap-4">
            <SearchInput aria-label="Search" placeholder="Search games" />
            <PasswordInput label="Password" value={password} onChange={setPassword} />
          </div>
        </div>
      </DesignCatalogSection>

      <DesignCatalogSection id="choosers" title="Choosers" hint="Select (own listbox, never native), Switch (say the state in words), Checkbox, ChoiceCards, Tabs, SegmentedControl, Pill.">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
          <Specimen name="Select">
            <Select<string> aria-label="Period" prefix="Period" size="sm" className="w-52" value={select} onChange={setSelect} options={[{ value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }]} />
          </Specimen>
          <Specimen name="Switch">
            <Switch checked={on} onChange={setOn} aria-label="Public profile" />
            <span className="text-sm">{on ? 'On' : 'Off'}</span>
          </Specimen>
          <Specimen name="Checkbox"><Checkbox checked={tick} onChange={setTick}>Show hidden</Checkbox></Specimen>
          <Specimen name="Pill"><Pill pressed={pill} count={12} onClick={() => setPill((p) => !p)}>Steam</Pill></Specimen>
          <Specimen name="SegmentedControl">
            <SegmentedControl<string> aria-label="View" value={seg} onChange={setSeg} options={[{ value: 'shelves', label: 'Shelves' }, { value: 'list', label: 'List' }, { value: 'cards', label: 'Cards' }]} />
          </Specimen>
        </div>
        <Specimen name="Tabs" className="w-full">
          <Tabs id="catalog-tabs" aria-label="Demo" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: 170 }, { value: 'ra', label: 'RetroAchievements', count: 26 }, { value: 'steam', label: 'Steam', count: 123 }]} />
        </Specimen>
        <ChoiceCards<string> legend="ChoiceCards" value={pick} onChange={setPick} columns={3} options={[{ value: 'a', label: 'One', hint: 'A first choice.' }, { value: 'b', label: 'Two', hint: 'A second choice.' }, { value: 'c', label: 'Three', hint: 'A third choice.' }]} />
      </DesignCatalogSection>
    </>
  )
}
