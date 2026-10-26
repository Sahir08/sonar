import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Logo from '../components/ui/Logo.jsx'
import { Disclaimer } from '../components/ui/Notices.jsx'
import Page from '../components/ui/Page.jsx'
import { APP_NAME, PITCH, SLOGAN, TAGLINE } from '../constants.js'
import './About.css'

export default function About() {
  return (
    <Page title={`About ${APP_NAME}`} back={{ to: '/', label: 'Home' }}>
      <div className="about__hero">
        <Logo size={44} />
        <div>
          <p className="about__slogan">{SLOGAN}</p>
          <p className="about__tagline">{TAGLINE}</p>
        </div>
      </div>

      <Card className="about__section">
        <h2 className="about__heading">What {APP_NAME} is</h2>
        <p>{PITCH}</p>
        <p>
          {APP_NAME} is for people with type 1 diabetes and their caregivers. It estimates the chance of a low (glucose
          below 70 mg/dL) in the next 60 minutes and shows what is driving that risk. It needs only CGM glucose data.
          Insulin, carbs, steps, and heart rate are shown as context but are not used for the prediction.
        </p>
      </Card>

      <Card className="about__section">
        <h2 className="about__heading">How explanations work</h2>
        <p>
          The model is an Explainable Boosting Machine. Its prediction is a sum of contributions from each input, so
          the explanation is the model&apos;s own math, not an approximation.
        </p>
        <p>
          {APP_NAME} groups those contributions into plain-language factors like glucose trend and time of day. When two
          inputs work together (an interaction), that contribution is split equally between their groups.
        </p>
      </Card>

      <Card className="about__section">
        <h2 className="about__heading">Data source</h2>
        <p>HUPA-UCM Diabetes Dataset (Mendeley Data).</p>
        <p className="about__muted">
          By J. Ignacio Hidalgo, Jorge Alvarado, Marta Botella, Aranzazu Aramendi, J. Manuel Velasco and Oscar
          Garnica.{' '}
          <a href="https://doi.org/10.17632/3hbcscwz44.1" target="_blank" rel="noreferrer">
            doi:10.17632/3hbcscwz44.1
          </a>
          , licensed under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          . The five demo patients are unmodified files from the dataset&apos;s preprocessed data.
        </p>
        <p className="about__muted">
          See <Link to="/performance">Model performance</Link> for results and limitations.
        </p>
      </Card>

      <Card className="about__section">
        <h2 className="about__heading">Built with</h2>
        <ul className="about__list">
          <li>React (web app)</li>
          <li>Flask (server)</li>
          <li>Explainable Boosting Machine via the InterpretML library (model)</li>
        </ul>
      </Card>

      <div className="page-cta">
        <Button variant="primary" size="lg" to="/demo" iconRight="arrowRight">
          Try the demo
        </Button>
      </div>

      <Disclaimer />
    </Page>
  )
}
