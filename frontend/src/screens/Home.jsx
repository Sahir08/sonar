import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Logo from '../components/ui/Logo.jsx'
import { Disclaimer } from '../components/ui/Notices.jsx'
import { APP_NAME, PITCH, SLOGAN } from '../constants.js'
import './Home.css'

const STEPS = [
  {
    title: 'CGM data in',
    text: 'Use a demo patient, upload a CSV export, or connect Nightscout. Glucose readings are all it needs.',
  },
  {
    title: `${APP_NAME} estimates next-hour risk`,
    text: 'With each reading, the model estimates the chance of a low in the next 60 minutes.',
  },
  {
    title: 'You see the alert and why',
    text: 'When a low is likely, you get a warning, plus the factors behind it in plain language.',
  },
]

export default function Home() {
  return (
    <div className="home">
      <header className="home__hero">
        <Logo size={64} />
        <h1 className="home__name">{APP_NAME}</h1>
        <p className="home__slogan">{SLOGAN}</p>
        <p className="home__pitch">{PITCH}</p>
      </header>

      <div className="home__ctas">
        <Button variant="primary" size="lg" to="/demo" iconRight="arrowRight">
          Try the demo
        </Button>
        <Button variant="secondary" size="lg" icon="upload" to="/upload">
          Upload your data
        </Button>
        <Button variant="secondary" size="lg" icon="link" to="/nightscout">
          Connect Nightscout
        </Button>
      </div>

      <section className="home__how" aria-labelledby="how-title">
        <h2 id="how-title" className="section-label">
          How it works
        </h2>
        <ol className="home__steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="home__step">
              <span className="home__step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="home__step-title">{s.title}</span>
                <span className="home__step-text">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <nav className="home__links" aria-label="Learn more">
        <Link to="/performance">
          <Icon name="gauge" size={20} />
          Model performance
        </Link>
        <Link to="/about">
          <Icon name="info" size={20} />
          About {APP_NAME}
        </Link>
      </nav>

      <Disclaimer />
    </div>
  )
}
