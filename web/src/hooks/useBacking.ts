import { useEffect, useRef, useState } from 'react'
import { DrumMachine } from 'smplr'
import type { Nota } from '@/theory/notas'
import { PROGRESSOES, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'

const INTERVALO_MS = 25
const JANELA_S = 0.1
const PASSOS = 16

export function useBacking() {
    const [tocando, setTocando] = useState(false)
    const [carregado, setCarregado] = useState(false)
    const [bpm, setBpm] = useState(90)
    const [tom, setTom] = useState<Nota>('A')
    const [estilo, setEstilo] = useState<NomeEstilo>('rock')
    const [progressao, setProgressao] = useState<NomeProgressao>('blues12')
    const [compassoAtual, setCompassoAtual] = useState(-1)
    const [tempoAtual, setTempoAtual] = useState(-1)

    const audio = useRef<AudioContext | null>(null)
    const bateria = useRef<DrumMachine | null>(null)

    useEffect(() => {
        const ctx = new AudioContext()
        audio.current = ctx
        let cancelado = false
        const drums = DrumMachine(ctx, { instrument: 'LM-2' })
        drums.ready.then(() => {
            if (cancelado) return
            bateria.current = drums
            setCarregado(true)
        })
        return () => {
            cancelado = true
            ctx.close()
        }
    }, [])

    const config = useRef({ bpm, estilo, progressao })
    useEffect(() => {
        config.current = { bpm, estilo, progressao }
    })

    useEffect(() => {
        const ctx = audio.current
        if (!tocando || !ctx) return
        ctx.resume()

        let proximoPasso = ctx.currentTime + 0.05
        let passo = 0 //Passo 0 = começo de compasso. Agenda o aviso para a tela acender o compasso, no horário em que ele soar, como o tempoAtual do metrônomo.
        let compasso = 0
        const timeouts: number[] = []

        const agendador = setInterval(() => {
            while (proximoPasso < ctx.currentTime + JANELA_S) {
                const c = config.current

                if (passo % 4 === 0) {
                    const esteCompasso = compasso
                    const esteTempo = passo / 4
                    const atraso = (proximoPasso - ctx.currentTime) * 1000
                    timeouts.push(
                        window.setTimeout(() => {
                            setCompassoAtual(esteCompasso)
                            setTempoAtual(esteTempo)
                        }, atraso),
                    )
                }

                for (const [peca, padrao] of Object.entries(ESTILOS[c.estilo].bateria)) { //Lista de pares [chave, valor]: ['kick', 'X.......X.X.....'], ['snare', ...]. É o foreach (var (peca, padrao) in dicionario) do C#.
                    const letra = padrao[passo]
                    if (letra !== '.') {
                        bateria.current?.start({ note: peca, time: proximoPasso, velocity: letra === 'X' ? 110 : 60 })
                    }
                }

                proximoPasso += 60 / c.bpm / 4
                passo = (passo + 1) % PASSOS
                if (passo === 0) compasso = (compasso + 1) % PROGRESSOES[c.progressao].compassos.length
            }
        }, INTERVALO_MS)

        return () => {
            clearInterval(agendador)
            timeouts.forEach(clearTimeout)
            setCompassoAtual(-1)
            setTempoAtual(-1)
        }
    }, [tocando])

    return { tocando, setTocando, carregado, bpm, setBpm, tom, setTom, estilo, setEstilo, progressao, setProgressao, compassoAtual, tempoAtual }
}