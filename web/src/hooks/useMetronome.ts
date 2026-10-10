import { useEffect, useRef, useState } from 'react'

const INTERVALO_MS = 25    // de quanto em quanto tempo o agendador acorda
const JANELA_S = 0.1       // até quanto do futuro ele agenda os cliques

export type Som = {
    nome: string
    onda: OscillatorType
    acento: number     // frequência (Hz) do tempo 1
    tempo: number      // frequência dos outros tempos
    sub: number        // frequência das subdivisões
    duracao: number    // segundos
}

export const SONS: Som[] = [
    { nome: 'Eletrônico', onda: 'sine', acento: 1500, tempo: 1000, sub: 700, duracao: 0.05 },
    { nome: 'Madeira', onda: 'triangle', acento: 1200, tempo: 800, sub: 600, duracao: 0.03 },
    { nome: 'Cowbell', onda: 'square', acento: 800, tempo: 560, sub: 420, duracao: 0.08 },
]
export type SpeedTrainer = {
    ativo: boolean
    aumento: number    // quantos BPM sobe
    aCada: number      // a cada quantos compassos
    teto: number       // até onde vai
}

export function useMetronome() {
    const [bpm, setBpm] = useState(100)
    const [tempos, setTempos] = useState(4)
    const [tocando, setTocando] = useState(false)
    const [tempoAtual, setTempoAtual] = useState(-1)
    const [subdivisao, setSubdivisao] = useState(1)
    const [som, setSom] = useState(SONS[0])
    const [volume, setVolume] = useState(0.6)
    const [acento, setAcento] = useState(true)
    const [trainer, setTrainer] = useState<SpeedTrainer>({ ativo: false, aumento: 5, aCada: 4, teto: 160 })

    const audio = useRef<AudioContext | null>(null)

    const config = useRef({ bpm, tempos, subdivisao, som, volume, acento, trainer })
    const toques = useRef<number[]>([])

    useEffect(() => {
        config.current = { bpm, tempos, subdivisao, som, volume, acento, trainer }
    })

    function mudarBpm(valor: number) {
        setBpm(Math.min(300, Math.max(30, Math.round(valor))))
    }

    function tap() {
        const agora = performance.now()
        toques.current = [...toques.current.filter((t) => agora - t < 2500), agora].slice(-5)

        const t = toques.current
        if (t.length >= 2) {
            const intervaloMedio = (t[t.length - 1] - t[0]) / (t.length - 1)
            mudarBpm(60000 / intervaloMedio)
        }
    }

    useEffect(() => {
        if (!tocando) return

        audio.current ??= new AudioContext()
        const ctx = audio.current
        ctx.resume()

        let proximoClique = ctx.currentTime + 0.05
        let passo = 0          // conta cada click, inclusive as subdivisões
        let compassos = 0
        const timeouts: number[] = []

        const agendador = setInterval(() => {
            while (proximoClique < ctx.currentTime + JANELA_S) {
                const c = config.current
                const ehTempo = passo % c.subdivisao === 0
                const tempo = Math.floor(passo / c.subdivisao)

                const frequencia = !ehTempo ? c.som.sub : tempo === 0 && c.acento ? c.som.acento : c.som.tempo
                tocarClique(ctx, proximoClique, c.som, frequencia, ehTempo ? c.volume : c.volume * 0.5)

                if (ehTempo) {
                    const atraso = (proximoClique - ctx.currentTime) * 1000
                    timeouts.push(setTimeout(() => setTempoAtual(tempo), atraso))
                }

                proximoClique += 60 / c.bpm / c.subdivisao
                passo = (passo + 1) % (c.tempos * c.subdivisao)
                if (passo === 0) {
                    compassos++
                    const t = c.trainer
                    if (t.ativo && compassos % t.aCada === 0 && c.bpm < t.teto) {
                        c.bpm = Math.min(t.teto, c.bpm + t.aumento)
                        setBpm(c.bpm)
                    }
                }
            }
        }, INTERVALO_MS)

        return () => {
            clearInterval(agendador)
            timeouts.forEach(clearTimeout)
            setTempoAtual(-1)
        }
    }, [tocando])

    return { bpm, mudarBpm, tempos, setTempos, tocando, setTocando, tempoAtual, subdivisao, setSubdivisao, som, setSom, volume, setVolume, acento, setAcento, tap, trainer, setTrainer }
}

function tocarClique(ctx: AudioContext, quando: number, som: Som, frequencia: number, volume: number) {
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()

    osc.type = som.onda
    osc.frequency.value = frequencia
    ganho.gain.setValueAtTime(volume, quando)
    ganho.gain.exponentialRampToValueAtTime(0.001, quando + som.duracao)

    osc.connect(ganho).connect(ctx.destination)
    osc.start(quando)
    osc.stop(quando + som.duracao)
}
