import Button from '../components/ui/Button.jsx'
import Page from '../components/ui/Page.jsx'
import { EmptyState } from '../components/ui/StateMessage.jsx'

export default function NotFound() {
  return (
    <Page title="Page not found" back={{ to: '/', label: 'Home' }}>
      <EmptyState title="This page doesn't exist." action={<Button to="/">Go home</Button>} />
    </Page>
  )
}
