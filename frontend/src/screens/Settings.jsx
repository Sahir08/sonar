import { Link } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import Icon from '../components/ui/Icon.jsx'
import Page from '../components/ui/Page.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { useSettings } from '../context/settings.js'
import './Settings.css'

const UNIT_OPTIONS = [
  { value: 'mgdl', label: 'mg/dL' },
  { value: 'mmol', label: 'mmol/L' },
]
const VIEW_OPTIONS = [
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'patient', label: 'Patient' },
]
const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

const LINKS = [
  { to: '/performance', label: 'Model performance', icon: 'gauge' },
  { to: '/about', label: 'About Sonar', icon: 'info' },
]

export default function Settings() {
  const { units, view, theme, updateSetting } = useSettings()
  return (
    <Page title="Settings" back={{ to: '/', label: 'Home' }}>
      <Card className="settings">
        <SegmentedControl
          legend="Units"
          options={UNIT_OPTIONS}
          value={units}
          onChange={(v) => updateSetting('units', v)}
        />
        <SegmentedControl
          legend="View"
          description="Caregiver view uses the patient's name. Patient view says “your”."
          options={VIEW_OPTIONS}
          value={view}
          onChange={(v) => updateSetting('view', v)}
        />
        <SegmentedControl
          legend="Theme"
          options={THEME_OPTIONS}
          value={theme}
          onChange={(v) => updateSetting('theme', v)}
        />
      </Card>
      <p className="settings__note">Settings are saved on this device. No health data is saved.</p>

      <nav aria-label="More about Sonar">
        <Card as="ul" className="settings__links">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="settings__link">
                <Icon name={l.icon} size={20} className="settings__link-icon" />
                <span>{l.label}</span>
                <Icon name="chevronRight" size={20} className="settings__link-chevron" />
              </Link>
            </li>
          ))}
        </Card>
      </nav>
    </Page>
  )
}
