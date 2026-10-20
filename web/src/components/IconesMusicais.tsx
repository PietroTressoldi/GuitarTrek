/*
  Ícones musicais desenhados em SVG (o lucide não tem notas nem instrumentos de percussão).
  Usam "currentColor": pegam a cor do texto em volta, então funcionam em qualquer tema.
*/
import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

/** Figura rítmica: 1 = semínima, 2 = colcheias, 3 = tercina, 4 = semicolcheias. */
export function IconeSubdivisao({ valor, ...props }: Props & { valor: number }) {
  const espaco = 8
  const hastes = Array.from({ length: valor }, (_, i) => 6.4 + i * espaco)
  const ultima = hastes[hastes.length - 1]
  return (
    <svg viewBox={`0 0 ${ultima + 3} 24`} fill="currentColor" aria-hidden {...props}>
      {hastes.map((x) => (
        <g key={x}>
          <ellipse cx={x - 2.9} cy={18.4} rx={3.1} ry={2.2} transform={`rotate(-22 ${x - 2.9} 18.4)`} />
          <rect x={x - 0.7} y={6} width={1.4} height={12.4} />
        </g>
      ))}
      {valor >= 2 && <rect x={hastes[0] - 0.7} y={6} width={ultima - hastes[0] + 1.4} height={2.4} />}
      {valor === 4 && <rect x={hastes[0] - 0.7} y={10} width={ultima - hastes[0] + 1.4} height={2.4} />}
      {valor === 3 && (
        <text x={hastes[1]} y={4} fontSize={5.5} fontWeight={700} textAnchor="middle">
          3
        </text>
      )}
    </svg>
  )
}

function Traco({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconesSom: Record<string, (props: Props) => React.JSX.Element> = {
  bipe: (p) => (
    <Traco {...p}>
      <path d="M2.5 12h5l2-6 4 12 2-6h6" />
    </Traco>
  ),
  woodblock: (p) => (
    <Traco {...p}>
      <rect x={3} y={8} width={18} height={9} rx={2.5} />
      <path d="M6.5 12.5h11" />
    </Traco>
  ),
  claves: (p) => (
    <Traco {...p} strokeWidth={2.4}>
      <path d="M4.5 8.5 19.5 15" />
      <path d="M7 19.5 17.5 4.5" />
    </Traco>
  ),
  cowbell: (p) => (
    <Traco {...p}>
      <path d="M8.5 7h7l3.5 12.5H5z" />
      <path d="M10.5 7V3.5h3V7" />
      <path d="M8 13.5h8" />
    </Traco>
  ),
  chimbal: (p) => (
    <Traco {...p}>
      <path d="M3 9.5c3.5-1.6 14.5-1.6 18 0" />
      <path d="M3 11.5c3.5 1.6 14.5 1.6 18 0" />
      <path d="M10.5 8.2a1.5 1.5 0 0 1 3 0" />
      <path d="M12 13v8M8.5 21h7" />
    </Traco>
  ),
}
