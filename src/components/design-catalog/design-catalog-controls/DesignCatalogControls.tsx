'use client'

import { useId, useState } from 'react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
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
import UserGameCardPreferencePreview from '@/components/user-page/user-game-card-preference/user-game-card-preference-preview/UserGameCardPreferencePreview'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'

const VARIANTS = ['primary', 'secondary', 'quiet', 'danger'] as const
const SIZES = ['sm', 'md', 'lg'] as const

function SwitchDemo() {
  const [on, setOn] = useState(true)
  const [off, setOff] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-5">
      <span className="inline-flex items-center gap-2.5"><Switch checked={on} onChange={setOn} aria-label="On by default" /><span className="text-sm">{on ? 'On' : 'Off'}</span></span>
      <span className="inline-flex items-center gap-2.5"><Switch checked={off} onChange={setOff} aria-label="Off by default" /><span className="text-sm">{off ? 'On' : 'Off'}</span></span>
      <span className="inline-flex items-center gap-2.5"><Switch checked onChange={() => {}} disabled aria-label="Disabled" /><span className="text-sm text-text-secondary">Disabled</span></span>
    </div>
  )
}

function TabsDemo() {
  const id = useId()
  const [tab, setTab] = useState('all')
  return <Tabs id={id} aria-label="Demo tabs" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: 170 }, { value: 'ra', label: 'RetroAchievements', count: 26 }, { value: 'steam', label: 'Steam', count: 123 }]} />
}

function SegmentedDemo() {
  const [seg, setSeg] = useState('list')
  const [small, setSmall] = useState('week')
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SegmentedControl<string> aria-label="View" value={seg} onChange={setSeg} options={[{ value: 'shelves', label: 'Shelves' }, { value: 'list', label: 'List' }, { value: 'cards', label: 'Cards' }]} />
      <SegmentedControl<string> aria-label="Period" size="xs" value={small} onChange={setSmall} options={[{ value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]} />
      <SegmentedControl<string> aria-label="Period, outlined" size="lg" tone="outline" value={small} onChange={setSmall} options={[{ value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]} />
    </div>
  )
}

function PillDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill pressed={a} count={12} onClick={() => setA((v) => !v)}>Steam</Pill>
      <Pill pressed={b} count={4} onClick={() => setB((v) => !v)}>PlayStation</Pill>
      <Pill pressed={false} disabled>Disabled</Pill>
    </div>
  )
}

function ChoiceDemo({ withPreview }: { withPreview?: boolean }) {
  const [pick, setPick] = useState('a')
  return (
    <ChoiceCards<string>
      legend={withPreview ? 'With a drawing above the words' : 'Words only'}
      value={pick}
      onChange={setPick}
      columns={withPreview ? 2 : 3}
      options={
        withPreview
          ? [
              { value: 'a', label: 'Colourful', hint: 'Takes the colour of the art.', preview: <UserGameCardPreferencePreview style="tinted" /> },
              { value: 'b', label: 'Flat', hint: 'A plain card.', preview: <UserGameCardPreferencePreview style="flat" /> },
            ]
          : [{ value: 'a', label: 'One', hint: 'A first choice.' }, { value: 'b', label: 'Two', hint: 'A second choice.' }, { value: 'c', label: 'Three', hint: 'A third choice.' }]
      }
    />
  )
}

function SelectDemo() {
  const [v, setV] = useState('week')
  const options = [{ value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }]
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Specimen name="field look, with a prefix"><Select<string> aria-label="Period" prefix="Period" size="sm" className="w-56" value={v} onChange={setV} options={options} /></Specimen>
      <Specimen name="look=&quot;button&quot;"><Select<string> aria-label="Order" look="button" size="sm" className="w-44" value={v} onChange={setV} options={options} /></Specimen>
    </div>
  )
}

function CheckboxDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <div className="flex flex-wrap gap-6">
      <Checkbox checked={a} onChange={setA}>Show hidden games</Checkbox>
      <Checkbox checked={b} onChange={setB}>Only finished</Checkbox>
      <Checkbox checked onChange={() => {}} disabled>Disabled</Checkbox>
    </div>
  )
}

/** Everything a person presses, types into or picks from, each in both designs where the shape matters. */
export default function DesignCatalogControls() {
  const [password, setPassword] = useState('')
  return (
    <>
      <DesignCatalogPiece id="button">
        <Compare>
          {VARIANTS.map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-2.5">
              {SIZES.map((s) => <Button key={s} variant={v} size={s}>{v} · {s}</Button>)}
              <Button variant={v} loading>Loading</Button>
              <Button variant={v} disabled>Disabled</Button>
            </div>
          ))}
          <Button href="/design" size="sm" className="self-start">As a link (href)</Button>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="icon-button">
        <Compare>
          <div className="flex flex-wrap items-center gap-2">
            {SIZES.map((s) => <IconButton key={s} size={s} aria-label={`Edit ${s}`}><IconPencil size={16} /></IconButton>)}
            <IconButton aria-label="Add" tone="accent"><IconPlus size={16} /></IconButton>
            <IconButton aria-label="Delete" tone="danger"><IconTrash size={16} /></IconButton>
            <IconButton aria-label="Pressed" aria-pressed><IconPencil size={16} /></IconButton>
            <IconButton aria-label="Disabled" disabled><IconPencil size={16} /></IconButton>
          </div>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="fields">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" aside="Optional" hint="Letters and numbers.">{(c) => <Input placeholder="ivanxmarine" {...c} />}</Field>
            <Field label="Email" error="This address is taken.">{(c) => <Input defaultValue="a@b.c" invalid {...c} />}</Field>
            <Field label="About you" aside="9 / 280">{(c) => <Textarea rows={3} placeholder="Hi World!" {...c} />}</Field>
            <div className="flex flex-col gap-4">
              <SearchInput aria-label="Search" placeholder="Search games" />
              <PasswordInput label="Password" value={password} onChange={setPassword} />
            </div>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="select"><Panel><SelectDemo /></Panel></DesignCatalogPiece>
      <DesignCatalogPiece id="switch"><Compare><SwitchDemo /></Compare></DesignCatalogPiece>
      <DesignCatalogPiece id="checkbox"><Panel><CheckboxDemo /></Panel></DesignCatalogPiece>
      <DesignCatalogPiece id="choice-cards"><Panel><ChoiceDemo /><ChoiceDemo withPreview /></Panel></DesignCatalogPiece>
      <DesignCatalogPiece id="tabs"><Compare><TabsDemo /></Compare></DesignCatalogPiece>
      <DesignCatalogPiece id="segmented"><Compare><SegmentedDemo /></Compare></DesignCatalogPiece>
      <DesignCatalogPiece id="pill"><Compare><PillDemo /></Compare></DesignCatalogPiece>
    </>
  )
}
