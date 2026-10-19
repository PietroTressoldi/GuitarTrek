import { AFINACAO_PADRAO, janela, notaNaCasa } from '@/theory/braco'
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

// Onde começa a faixa de uma casa: na borda esquerda dela (a casa 0 começa no canto do braço)
function xFaixa(casa: number) {
    return casa === 0 ? 0 : X_PESTANA + (casa - 1) * LARGURA_CASA
}

// [cor do círculo, cor do texto]. Com um acorde na tela, só a tônica DO ACORDE fica cheia em âmbar.
function cores(ehTonica: boolean, doAcorde: boolean, comAcorde: boolean): [string, string] {
    if (ehTonica && (doAcorde || !comAcorde)) return ['fill-primary stroke-primary', 'fill-primary-foreground']
    if (ehTonica) return ['fill-card stroke-primary', 'fill-primary']
    if (doAcorde) return ['fill-foreground stroke-foreground', 'fill-background']
    return ['fill-card stroke-cat-escalas', 'fill-foreground']
}

export type Exibicao = 'nota' | 'grau'

type Props = {
    tonica: Nota
    notas: Nota[]
    mostrar?: Exibicao
    alvos?: Nota[]
    destaque?: string[]
    desenhos?: string[][]
    proximo?: string[]
    chegada?: number
}

export function Fretboard({ tonica, notas, mostrar = 'nota', alvos = [], destaque = [], desenhos = [], proximo = [], chegada = 0 }: Props) {

    const acorde = desenhos.flat()
    const comAcorde = acorde.length > 0

    // com várias formas ("Todas") as faixas se sobrepõem e viram listras: só desenha com uma
    const faixa = desenhos.length === 1 ? janela(desenhos[0]) : null

    const casas = Array.from({ length: CASAS + 1 }, (_, i) => i) //Cria [0, 1, 2, ..., 15]. É o Enumerable.Range(0, 16) do C#. O _ é o nome convencional para "parâmetro que eu não uso".

    return (
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full min-w-[640px]"> {/*Ocupa toda a largura, mas nunca menos de 640px. No celular, o braço não vira um risquinho: ele rola de lado.*/}
            {faixa && (
                <rect
                    x={xFaixa(faixa[0])}
                    y={Y_TOPO - 16}
                    width={X_PESTANA + faixa[1] * LARGURA_CASA - xFaixa(faixa[0])}
                    height={5 * ESPACO_CORDA + 32}
                    rx={8}
                    className="fill-primary opacity-10"
                />
            )}
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
            {desenhos.map((desenho, i) => (
                <polyline
                    key={i}
                    points={desenho
                        .map((chave) => {
                            const [corda, casa] = chave.split('-').map(Number)
                            return `${xCasa(casa)},${yCorda(corda)}`
                        })
                        .join(' ')}
                    fill="none"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    className="stroke-foreground opacity-25"
                />
            ))}
            <motion.g key={proximo.join(' ')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: chegada, ease: 'linear' }}>
                {proximo.map((chave) => {
                    const [corda, casa] = chave.split('-').map(Number)
                    return (
                        <circle
                            key={chave}
                            cx={xCasa(casa)}
                            cy={yCorda(corda)}
                            r={15}
                            fill="none"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            className="stroke-muted-foreground"
                        />
                    )
                })}
            </motion.g>
            <AnimatePresence>
                {AFINACAO_PADRAO.flatMap((_, corda) =>
                    casas.map((casa) => {
                        const nota = notaNaCasa(corda, casa)
                        const chave = `${corda}-${casa}`
                        const doAcorde = acorde.includes(chave)
                        if (!notas.includes(nota) && !doAcorde) return null
                        const ehTonica = nota === tonica
                        const apagada = destaque.length > 0 && !destaque.includes(chave)
                        const soEscala = comAcorde && !doAcorde
                        const [corCirculo, corTexto] = cores(ehTonica, doAcorde, comAcorde)
                        return (
                            <motion.g
                                key={chave}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, opacity: apagada ? 0.1 : soEscala ? 0.6 : 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <circle
                                    cx={xCasa(casa)}
                                    cy={yCorda(corda)}
                                    r={soEscala ? 9 : 11}
                                    strokeWidth={alvos.includes(nota) ? 4 : 2}
                                    className={corCirculo}
                                />
                                <text
                                    x={xCasa(casa)}
                                    y={yCorda(corda)}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={600}
                                    className={corTexto}
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