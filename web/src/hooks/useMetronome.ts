import { useEffect, useRef, useState } from 'react'

const INTERVALO_MS = 25    // de quanto em quanto tempo o agendador acorda
const JANELA_S = 0.1       // até quanto do futuro ele agenda os cliques

export type Som = {
    id: string      // nome do arquivo em /sons, sem o .wav
    nome: string    // o que aparece na tela
}

export const SONS: Som[] = [
    { id: 'bipe', nome: 'Bipe' },
    { id: 'woodblock', nome: 'Woodblock' },
    { id: 'claves', nome: 'Claves' },
    { id: 'cowbell', nome: 'Cowbell' },
    { id: 'chimbal', nome: 'Chimbal' },
]

const ALTURA_ACENTO = 1.33   // o tempo 1 toca o mesmo som uma quarta acima

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
    const amostras = useRef<Record<string, AudioBuffer>>({})

    useEffect(() => {
        const ctx = new AudioContext()
        audio.current = ctx
        for (const s of SONS) {
            carregarAmostra(ctx, `/sons/${s.id}.wav`).then((buffer) => {
                amostras.current[s.id] = buffer
            })
        }
        return () => {
            ctx.close()
        }
    }, [])

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

    function ouvir(s: Som) {
        const ctx = audio.current
        const buffer = amostras.current[s.id]

        if (!ctx || !buffer) return
        ctx.resume()
        tocarAmostra(ctx, buffer, ctx.currentTime, config.current.volume, 1)
    }

    useEffect(() => {
        if (!tocando) return

        const ctx = audio.current
        if (!ctx) return
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

                const buffer = amostras.current[c.som.id]
                if (buffer) {
                    const altura = tempo === 0 && ehTempo && c.acento ? ALTURA_ACENTO : 1
                    tocarAmostra(ctx, buffer, proximoClique, ehTempo ? c.volume : c.volume * 0.45, altura)
                }

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

    return { bpm, mudarBpm, tempos, setTempos, tocando, setTocando, tempoAtual, subdivisao, setSubdivisao, som, setSom, volume, setVolume, acento, setAcento, tap, ouvir, trainer, setTrainer }
}


async function carregarAmostra(ctx: AudioContext, url: string) {
    const resposta = await fetch(url)
    const bytes = await resposta.arrayBuffer()
    return ctx.decodeAudioData(bytes)
}

function tocarAmostra(ctx: AudioContext, buffer: AudioBuffer, quando: number, volume: number, altura: number) {

    const fonte = ctx.createBufferSource()
    const ganho = ctx.createGain()

    fonte.buffer = buffer
    fonte.playbackRate.value = altura
    ganho.gain.value = volume

    fonte.connect(ganho).connect(ctx.destination)
    fonte.start(quando)
}