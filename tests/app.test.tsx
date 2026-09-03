import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from '../src/app/App';

vi.mock('../src/experience/ExperienceCanvas', () => ({
  default: () => <div data-testid="experience-canvas" />,
}));

vi.mock('../src/components/WebGLFallback', () => ({
  default: () => <div data-testid="webgl-fallback" />,
  supportsWebGL: () => true,
}));

describe('App narrative shell', () => {
  test('renders the complete semantic journey and controls', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(10);
    expect(screen.getByRole('button', { name: /sound/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/journey progress/i)).toBeInTheDocument();
  });
});
