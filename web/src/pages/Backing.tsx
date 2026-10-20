import { useEffect, useState } from 'react'
import { Minus, Pause, Play, Plus, Volume2, VolumeX } from 'lucide-react'
import { CANAIS, TIMBRES, type Canal, type Timbres } from '@/backing/timbres'
import { NOTAS, type Nota } from '@/theory/notas'
import { cifra, FORMAS, voicing, type Forma } from '@/theory/acordes'
import { notasDaEscala, ROTULOS_ESCALA, type NomeEscala } from '@/theory/escalas'
import { aoRedor, janela } from '@/theory/braco'
import { acordeDoGrau, formaPerto, funcao, PROGRESSOES, type Funcao, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'
import { useBacking } from '@/hooks/useBacking'
import { Alternador } from '@/components/Alternador'
import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { LegendaPapeis } from '@/components/LegendaPapeis'

const NOMES_PROGRESSAO = Object.keys(PROGRESSOES) as NomeProgressao[]
const NOMES_ESCALA = Object.keys(ROTULOS_ESCALA) as NomeEscala[]

const OPCOES_ESTILO = (Object.keys(ESTILOS) as NomeEstilo[]).map((e) => ({ valor: e, rotulo: ESTILOS[e].nome }))
const NOMES_CANAL = { bateria: 'Bateria', baixo: 'Baixo', teclado: 'Teclado' } satisfies Record<Canal, string>

const OPCOES_MOSTRAR = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

// T = tônica (repouso), S = subdominante (afasta), D = dominante (pede a volta)
const COR_FUNCAO = { T: 'text-funcao-t', S: 'text-funcao-s', D: 'text-funcao-d' } satisfies Record<Funcao, string>
const NOME_FUNCAO = { T: 'tônica', S: 'subdominante', D: 'dominante' } satisfies Record<Funcao, string>

export function Backing() {
    const b = useBacking()
    const [escala, setEscala] = useState<NomeEscala>('blues')
    const [regiao, setRegiao] = useState<Forma | null>('E')
    const [mostrar, setMostrar] = useState<Exibicao>('grau')

    const { tocando, setTocando } = b
    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.code === 'Space') {
                e.preventDefault()
                setTocando(!tocando)
            }
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [tocando, setTocando])

    const compassos = PROGRESSOES[b.progressao].compassos.map((grau) => ({ grau, ...acordeDoGrau(b.tom, grau) }))
    const indice = b.compassoAtual === -1 ? 0 : b.compassoAtual % compassos.length
    const atual = compassos[indice]
    const proximo = compassos[(indice + 1) % compassos.length]

    // A região é uma forma do PRIMEIRO acorde: ela fica parada, e cada acorde usa a forma dele que cai ali
    const primeiro = compassos[0]
    const OPCOES_REGIAO = [
        ...(Object.keys(FORMAS) as Forma[]).map((f) => {
            const [de, ate] = janela(voicing(primeiro.raiz, primeiro.tipo, f))
            return { valor: f, rotulo: `${f} · ${de}–${ate}` }
        }),
        { valor: null, rotulo: 'Todo o braço' },
    ]

    const notas = notasDaEscala(b.tom, escala)
    const base = regiao === null ? null : voicing(primeiro.raiz, primeiro.tipo, regiao)
    const desenhos = base
        ? [formaPerto(atual.raiz, atual.tipo, base)]
        : (Object.keys(FORMAS) as Forma[]).map((f) => voicing(atual.raiz, atual.tipo, f))
    const destaque = base ? [...aoRedor(base, notas), ...desenhos[0]] : []
    const vaiTrocar = b.tocando && cifra(proximo.raiz, proximo.tipo) !== cifra(atual.raiz, atual.tipo)
    const desenhoProximo = base && vaiTrocar ? formaPerto(proximo.raiz, proximo.tipo, base) : []

    return (
        <section className="flex max-w-6xl flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-4xl">Backing tracks</h1>
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Progressão
                    <select
                        value={b.progressao}
                        onChange={(e) => {
                            const nova = e.target.value as NomeProgressao
                            b.setProgressao(nova)
                            setEscala(PROGRESSOES[nova].escala)
                        }}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_PROGRESSAO.map((nome) => (
                            <option key={nome} value={nome}>
                                {PROGRESSOES[nome].nome}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            {/* 1. Transporte */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card px-5 py-4">
                <button
                    onClick={() => b.setTocando(!b.tocando)}
                    disabled={!b.carregado}
                    aria-label={b.tocando ? 'Parar' : 'Tocar'}
                    className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                    {b.tocando ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
                </button>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tom
                    <select
                        value={b.tom}
                        onChange={(e) => b.setTom(e.target.value as Nota)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOTAS.map((nota) => (
                            <option key={nota}>{nota}</option>
                        ))}
                    </select>
                </label>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    BPM
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => b.setBpm(Math.max(40, b.bpm - 5))}
                            aria-label="Diminuir BPM"
                            className="grid size-8 place-items-center rounded-md border hover:text-foreground"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-16 text-center font-heading text-3xl font-semibold tabular-nums text-foreground font-stretch-expanded">
                            {b.bpm}
                        </span>
                        <button
                            onClick={() => b.setBpm(Math.min(240, b.bpm + 5))}
                            aria-label="Aumentar BPM"
                            className="grid size-8 place-items-center rounded-md border hover:text-foreground"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Estilo
                    <Alternador opcoes={OPCOES_ESTILO} valor={b.estilo} onChange={b.setEstilo} />
                </div>

                <span className="ml-auto text-xs text-muted-foreground">
                    <kbd className="rounded border border-b-2 px-1.5 py-0.5 font-sans">Espaço</kbd> toca / para
                </span>
            </div>
            {/* 2. Agora + grade */}
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                <div className="flex flex-col gap-5 rounded-xl border bg-card p-6">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Agora · compasso {indice + 1} de {compassos.length}</span>
                        {b.tocando && (
                            <span className={`flex items-center gap-1.5 rounded bg-secondary px-2 py-0.5 ${b.refrao ? 'text-foreground' : ''}`}>
                                {b.refrao && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                                {b.refrao ? 'Refrão' : 'Verso'}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-heading text-7xl font-semibold font-stretch-expanded">{cifra(atual.raiz, atual.tipo)}</p>
                        <p className="flex items-baseline gap-3 font-heading text-lg font-semibold font-stretch-expanded">
                            <span className="text-primary">{atual.grau}</span>
                            <span className={`text-sm ${COR_FUNCAO[funcao(atual.grau)]}`}>{NOME_FUNCAO[funcao(atual.grau)]}</span>
                        </p>
                    </div>
                    <div className="flex gap-2.5">
                        {[0, 1, 2, 3].map((t) => (
                            <span
                                key={t}
                                className={`size-3.5 rounded-full ${t > b.tempoAtual
                                    ? 'bg-secondary'
                                    : t === 0
                                        ? 'bg-foreground shadow-[0_0_10px_var(--foreground)]'
                                        : 'bg-primary shadow-[0_0_10px_var(--primary)]'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex items-baseline justify-between border-t pt-4">
                        <span className="text-xs text-muted-foreground">Próximo</span>
                        <span>
                            <b className="font-heading text-2xl font-semibold font-stretch-expanded">{cifra(proximo.raiz, proximo.tipo)}</b>{' '}
                            <span className="text-muted-foreground">{proximo.grau}</span>
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-xl border bg-border">
                        {compassos.map((acorde, i) => {
                            const agora = b.tocando && i === indice
                            const passou = b.tocando && i < indice
                            return (
                                <div key={i} className={`relative flex flex-col gap-1 px-4 pt-3.5 pb-4 ${agora ? 'bg-secondary' : 'bg-card'}`}>
                                    <span className="absolute top-2.5 right-3 text-[11px] text-muted-foreground">{i + 1}</span>
                                    <b
                                        className={`flex items-center gap-2.5 font-heading text-xl font-semibold font-stretch-expanded ${agora ? 'text-foreground' : passou ? 'text-foreground/55' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {agora && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                                        {cifra(acorde.raiz, acorde.tipo)}
                                    </b>
                                    <small className="flex items-center gap-2 text-xs">
                                        <span className={agora ? 'text-primary' : 'text-muted-foreground'}>{acorde.grau}</span>
                                        <span className={`font-semibold ${COR_FUNCAO[funcao(acorde.grau)]}`} title={NOME_FUNCAO[funcao(acorde.grau)]}>
                                            {funcao(acorde.grau)}
                                        </span>
                                    </small>
                                    {agora && (
                                        <span
                                            className="absolute bottom-0 left-0 h-0.5 bg-primary transition-[width] duration-300"
                                            style={{ width: `${(b.tempoAtual + 1) * 25}%` }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="grid gap-x-6 gap-y-5 rounded-xl border bg-card px-5 py-4 md:grid-cols-3">
                        {CANAIS.map((canal) => {
                            const { volume, mudo } = b.mixer[canal]
                            const carregando = b.prontos[canal] !== b.timbres[canal]
                            return (
                                <div key={canal} className={`flex flex-col gap-2 ${mudo ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            {NOMES_CANAL[canal]}
                                            {carregando && <span className="motion-safe:animate-pulse">carregando…</span>}
                                        </span>
                                        <select
                                            value={b.timbres[canal]}
                                            onChange={(e) => b.mudarTimbre(canal, e.target.value as Timbres[Canal])}
                                            aria-label={`Timbre: ${NOMES_CANAL[canal]}`}
                                            className="rounded-md border bg-card px-2 py-1 text-xs text-foreground"
                                        >
                                            {Object.entries(TIMBRES[canal]).map(([chave, timbre]) => (
                                                <option key={chave} value={chave}>
                                                    {timbre.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => b.mudarCanal(canal, { mudo: !mudo })}
                                            aria-pressed={mudo}
                                            aria-label={`Mudo: ${NOMES_CANAL[canal]}`}
                                            className={`grid size-8 shrink-0 place-items-center rounded-md border ${mudo ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {mudo ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                                        </button>
                                        <input
                                            type="range"
                                            min={0}
                                            max={127}
                                            value={volume}
                                            onChange={(e) => b.mudarCanal(canal, { volume: Number(e.target.value) })}
                                            aria-label={`Volume: ${NOMES_CANAL[canal]}`}
                                            className="flex-1 accent-primary"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            {/* 3. Braço */}
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-end gap-5">
                    <h2 className="mr-auto text-lg">No braço</h2>
                    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        Escala
                        <select
                            value={escala}
                            onChange={(e) => setEscala(e.target.value as NomeEscala)}
                            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                        >
                            {NOMES_ESCALA.map((nome) => (
                                <option key={nome} value={nome}>
                                    {ROTULOS_ESCALA[nome]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex max-w-full flex-col gap-1.5 text-xs text-muted-foreground">
                        Região
                        <div className="overflow-x-auto">
                            <Alternador opcoes={OPCOES_REGIAO} valor={regiao} onChange={setRegiao} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        Mostrar
                        <Alternador opcoes={OPCOES_MOSTRAR} valor={mostrar} onChange={setMostrar} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Fretboard
                        tonica={atual.raiz}
                        notas={notas}
                        mostrar={mostrar}
                        destaque={destaque}
                        desenhos={desenhos}
                        proximo={desenhoProximo}
                        chegada={(60 / b.bpm) * 4}
                        acorde={atual}
                        proximoAcorde={proximo}
                    />
                </div>
                <LegendaPapeis
                    extra={
                        <>
                            <span className="size-3.5 rounded-full border-2 border-dashed border-muted-foreground" /> Próxima troca (na cor do papel no próximo acorde)
                        </>
                    }
                />
            </div>
        </section>
    )
}
