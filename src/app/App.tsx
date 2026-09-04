import ExperienceShell from './ExperienceShell';
import { ObservabilityProvider } from '../observability/react';
import '../styles/global.css';

export default function App() {
  return (
    <ObservabilityProvider>
      <ExperienceShell />
    </ObservabilityProvider>
  );
}
