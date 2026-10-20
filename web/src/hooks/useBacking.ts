import { useEffect, useRef, useState } from 'react'
import { Reverb, type Smplr } from 'smplr'
import type { Nota } from '@/theory/notas'
import { acordeDoGrau, PROGRESSOES, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'
import { duracaoEmPassos, notaDoBaixo, notasDoTeclado } from '@/backing/notas'
import { CANAIS, criarTimbre, SALA, type Canal, type Timbres } from '@/backing/timbres'
import { bateriaDoCompasso, tamanhoDaSecao } from '@/backing/bateria'

const INTERVALO_MS = 25
const JANELA_S = 0.1
const PASSOS = 16

type Mixer = Record<Canal, { volume: number; mudo: boolean }>

// Um músico nunca toca exatamente no tempo nem com a mesma força: ±5 ms e ±6 de força
const humano = () => (Math.random() - 0.5) * 0.01
const forca = (v: number) => Math.max(1, Math.min(127, Math.round(v + (Math.random() - 0.5) * 12)))

export function useBacking() {
    const [tocando, setTocando] = useState(false)
    const [bpm, setBpm] = useState(90)
    const [tom, setTom] = useState<Nota>('A')
    const [estilo, setEstiloSo] = useState<NomeEstilo>('rock')
    const [progressao, setProgressao] = useState<NomeProgressao>('blues12')
    const [compassoAtual, setCompassoAtual] = useState(-1)
    const [tempoAtual, setTempoAtual] = useState(-1)
    const [timbres, setTimbres] = useState<Timbres>(ESTILOS.rock.timbres)
    const [prontos, setProntos] = useState<Partial<Record<Canal, string>>>({})
    const [mixer, setMixer] = useState<Mixer>({
        bateria: { volume: 100, mudo: false },
        baixo: { volume: 100, mudo: false },
        teclado: { volume: 80, mudo: false },
    })
    const [refrao, setRefrao] = useState(false)

    const audio = useRef<{ ctx: AudioContext; reverb: ReturnType<typeof Reverb> } | null>(null)
    const instrumentos = useRef<Partial<Record<Canal, Smplr>>>({})

    useEffect(() => {
        const ctx = new AudioContext()
        audio.current = { ctx, reverb: Reverb(ctx) }
        return () => {
            ctx.close()
            audio.current = null
            instrumentos.current = {}
            setProntos({})
        }
    }, [])

    // Carrega o timbre de cada canal que mudou. O antigo continua tocando até o novo ficar pronto.
    useEffect(() => {
        const sala = audio.current
        if (!sala) return
        let cancelado = false
        for (const canal of CANAIS) {
            const nome = timbres[canal] as string
            if (prontos[canal] === nome) continue
            const novo = criarTimbre(sala.ctx, canal, nome)
            novo.output.pan = SALA[canal].pan
            if (SALA[canal].reverb > 0) novo.output.addEffect('reverb', sala.reverb, SALA[canal].reverb)
            novo.ready.then(() => {
                if (cancelado) return novo.dispose()
                instrumentos.current[canal]?.dispose()
                instrumentos.current[canal] = novo
                setProntos((atual) => ({ ...atual, [canal]: nome }))
            })
        }
        return () => {
            cancelado = true
        }
        // sem `prontos` de propósito: ele muda por causa deste efeito, e incluí-lo recarregaria tudo de novo
    }, [timbres])

    const carregado = CANAIS.every((canal) => prontos[canal])

    useEffect(() => {
        for (const canal of CANAIS) {
            const inst = instrumentos.current[canal]
            if (inst) inst.output.volume = mixer[canal].mudo ? 0 : mixer[canal].volume
        }
    }, [mixer, prontos])

    function mudarCanal(canal: Canal, novo: Partial<Mixer[Canal]>) {
        setMixer((atual) => ({ ...atual, [canal]: { ...atual[canal], ...novo } }))
    }

    function mudarTimbre<C extends Canal>(canal: C, nome: Timbres[C]) {
        setTimbres((atual) => ({ ...atual, [canal]: nome }))
    }

    // Trocar de estilo traz junto o som que combina com ele
    function setEstilo(novo: NomeEstilo) {
        setEstiloSo(novo)
        setTimbres(ESTILOS[novo].timbres)
    }

    const config = useRef({ bpm, tom, estilo, progressao })
    useEffect(() => {
        config.current = { bpm, tom, estilo, progressao }
    })

    useEffect(() => {
        const ctx = audio.current?.ctx
        if (!tocando || !ctx) return
        ctx.resume()

        let proximoPasso = ctx.currentTime + 0.05
        let passo = 0
        let compasso = 0
        let total = 0 // compassos tocados desde o play: dá a seção (verso ou refrão) e a posição dentro dela
        const timeouts: number[] = []

        const agendador = setInterval(() => {
            while (proximoPasso < ctx.currentTime + JANELA_S) {
                const c = config.current
                const e = ESTILOS[c.estilo]
                const inst = instrumentos.current
                const duracao = 60 / c.bpm / 4
                const graus = PROGRESSOES[c.progressao].compassos
                const acorde = acordeDoGrau(c.tom, graus[compasso % graus.length])
                // Swing: a 2ª colcheia de cada tempo (passos 2, 6, 10, 14) atrasa até 2/3 de um passo
                const quando = proximoPasso + (passo % 4 === 2 ? e.swing * duracao * (2 / 3) : 0)

                if (passo % 4 === 0) {
                    const esteCompasso = compasso
                    const esteTempo = passo / 4
                    const esteRefrao = Math.floor(total / tamanhoDaSecao(graus.length)) % 2 === 1
                    const atraso = (proximoPasso - ctx.currentTime) * 1000
                    timeouts.push(
                        window.setTimeout(() => {
                            setCompassoAtual(esteCompasso)
                            setTempoAtual(esteTempo)
                            setRefrao(esteRefrao)
                        }, atraso),
                    )
                }

                const secao = tamanhoDaSecao(graus.length)
                const bateria = bateriaDoCompasso(e, total % secao, secao, Math.floor(total / secao))
                for (const [peca, padrao] of Object.entries(bateria)) {
                    const letra = padrao[passo]
                    if (letra === 'X' || letra === 'x') {
                        inst.bateria?.start({ note: `${peca}-${letra}`, time: quando + humano() / 2, velocity: forca(letra === 'X' ? 110 : 70) })
                    }
                }

                const codigo = e.baixo[passo]
                if (codigo !== '.' && codigo !== '-') {
                    inst.baixo?.start({
                        note: notaDoBaixo(acorde, codigo),
                        time: quando + humano(),
                        duration: duracaoEmPassos(e.baixo, passo) * duracao * 0.9,
                        velocity: forca(95),
                    })
                }

                const letra = e.teclado[passo]
                if (letra === 'X' || letra === 'x') {
                    const inicio = quando + humano()
                    for (const nota of notasDoTeclado(acorde)) {
                        inst.teclado?.start({
                            note: nota,
                            time: inicio,
                            duration: duracaoEmPassos(e.teclado, passo) * duracao * 0.9,
                            velocity: forca(letra === 'X' ? 80 : 55),
                        })
                    }
                }

                proximoPasso += duracao
                passo = (passo + 1) % PASSOS

                if (passo === 0) {
                    compasso = (compasso + 1) % graus.length
                    total++
                }
            }
        }, INTERVALO_MS)

        return () => {
            clearInterval(agendador)
            timeouts.forEach(clearTimeout)
            for (const canal of CANAIS) instrumentos.current[canal]?.stop()
            setCompassoAtual(-1)
            setTempoAtual(-1)
            setRefrao(false)
        }
    }, [tocando])

    return {
        tocando, setTocando, carregado, bpm, setBpm, tom, setTom, estilo, setEstilo, progressao, setProgressao,
        compassoAtual, tempoAtual, refrao, mixer, mudarCanal, timbres, mudarTimbre, prontos,
    }
}