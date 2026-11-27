
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

function ChromaticSmokeTest() {
  return (
    <main
      style={{
        width: '360px',
        padding: '28px',
        border: '1px solid #e5e7eb',
        borderRadius: '14px',
        background: '#ffffff',
        color: '#111827',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '1px',
        }}
      >
        DOVEXO
      </p>

      <h2>¡Todo está conectado!</h2>

      <p style={{ color: '#64748b', lineHeight: 1.6 }}>
        Esta es nuestra primera historia de Storybook.
        Chromatic ya puede comenzar a verificar componentes.
      </p>

      <button
        type="button"
        style={{
          padding: '11px 18px',
          border: 0,
          borderRadius: '8px',
          background: '#2563eb',
          color: '#ffffff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Probar componente
      </button>
    </main>
  );
}

const meta = {
  title: 'DOVEXO/Chromatic Smoke Test',
  component: ChromaticSmokeTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChromaticSmokeTest>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
