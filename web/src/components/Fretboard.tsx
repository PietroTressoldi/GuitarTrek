import { AFINACAO_PADRAO, notaNaCasa } from '@/theory/braco'
import { notasDaEscala, type NomeEscala } from '@/theory/escalas'
import { grau, type Nota } from '@/theory/notas'
import { AnimatePresence, motion } from 'motion/react'

const CASAS = 17
const LARGURA_CASA = 60
const ESPACO_CORDA = 30
const X_PESTANA = 40 //A pestana (onde as cordas soltas terminam) fica a 40 unidades da esquerda. Sobra espaço à esquerda para as notas das cordas soltas.
const Y_TOPO = 24

const LARGURA = X_PESTANA + CASAS * LARGURA_CASA + 10
const ALTURA = Y_TOPO + 5 * ESPACO_CORDA + 44

//	Altura de cada corda: a corda 0 em Y_TOPO, e cada próxima 30 unidades abaixo.
function yCorda(corda: number) {
    return Y_TOPO + corda * ESPACO_CORDA
}

//	Onde desenhar a nota de uma casa: no meio da casa (por isso o - 0.5). A casa 0 (corda solta) fica antes da pestana.
function xCasa(casa: number) {
    return casa === 0 ? X_PESTANA / 2 : X_PESTANA + (casa - 0.5) * LARGURA_CASA
}

export type Exibicao = 'nota' | 'grau'

type Props = {
    tonica: Nota
    escala: NomeEscala
    mostrar?: Exibicao
    alvos?: Nota[]
    destaque?: string[]
}

export function Fretboard({ tonica, escala, mostrar = 'nota', alvos = [], destaque = [] }: Props) {
    const notas = notasDaEscala(tonica, escala)
    const casas = Array.from({ length: CASAS + 1 }, (_, i) => i) //Cria [0, 1, 2, ..., 15]. É o Enumerable.Range(0, 16) do C#. O _ é o nome convencional para "parâmetro que eu não uso".

    return (
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full min-w-[640px]"> {/*Ocupa toda a largura, mas nunca menos de 640px. No celular, o braço não vira um risquinho: ele rola de lado.*/}
            {casas.map((casa) => (
                <line
                    key={casa}
                    x1={X_PESTANA + casa * LARGURA_CASA}
                    x2={X_PESTANA + casa * LARGURA_CASA}
                    y1={yCorda(0)}
                    y2={yCorda(5)}
                    strokeWidth={casa === 0 ? 6 : 2}
                    className="stroke-border"
                />
            ))}
            {AFINACAO_PADRAO.map((_, corda) => (
                <line
                    key={corda}
                    x1={X_PESTANA}
                    x2={LARGURA - 10}
                    y1={yCorda(corda)}
                    y2={yCorda(corda)}
                    strokeWidth={1 + corda * 0.4}
                    className="stroke-muted-foreground"
                />
            ))}
            {[3, 5, 7, 9, 15, 17].map((casa) => (
                <circle key={casa} cx={xCasa(casa)} cy={yCorda(2.5)} r={5} className="fill-muted" />
            ))}
            <circle cx={xCasa(12)} cy={yCorda(1.5)} r={5} className="fill-muted" />
            <circle cx={xCasa(12)} cy={yCorda(3.5)} r={5} className="fill-muted" />
            {casas.slice(1).map((casa) => (
                <text key={casa} x={xCasa(casa)} y={ALTURA - 12} textAnchor="middle" fontSize={11} className="fill-muted-foreground">
                    {casa}
                </text>
            ))}
            <AnimatePresence>
                {AFINACAO_PADRAO.flatMap((_, corda) =>
                    casas.map((casa) => {
                        const nota = notaNaCasa(corda, casa)
                        if (!notas.includes(nota)) return null
                        const ehTonica = nota === tonica
                        const chave = `${corda}-${casa}`
                        const apagada = destaque.length > 0 && !destaque.includes(chave)
                        return (
                            <motion.g
                                key={chave}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, opacity: apagada ? 0.15 : 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <circle
                                    cx={xCasa(casa)}
                                    cy={yCorda(corda)}
                                    r={11}
                                    strokeWidth={alvos.includes(nota) ? 4 : 2}
                                    className={ehTonica ? 'fill-primary stroke-primary' : 'fill-card stroke-cat-escalas'}
                                />
                                <text
                                    x={xCasa(casa)}
                                    y={yCorda(corda)}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={600}
                                    className={ehTonica ? 'fill-primary-foreground' : 'fill-foreground'}
                                >
                                    {mostrar === 'grau' ? grau(tonica, nota) : nota}
                                </text>
                            </motion.g>
                        )
                    }),
                )}
            </AnimatePresence>
        </svg>
    )
}