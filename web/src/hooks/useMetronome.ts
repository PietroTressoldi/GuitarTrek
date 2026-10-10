import { useEffect, useRef, useState } from 'react'

const INTERVALO_MS = 25    // de quanto em quanto tempo o agendador acorda
const JANELA_S = 0.1       // até quanto do futuro ele agenda os cliques

export function useMetronome() {
    const [bpm, setBpm] = useState(100)
    const [tempos, setTempos] = useState(4)
    const [tocando, setTocando] = useState(false)
    const [tempoAtual, setTempoAtual] = useState(-1)
  
    const audio = useRef<AudioContext | null>(null)
    const bpmRef = useRef(bpm)
    const temposRef = useRef(tempos)
  
    useEffect(() => { bpmRef.current = bpm }, [bpm])
    useEffect(() => { temposRef.current = tempos }, [tempos])
  
    useEffect(() => {
      if (!tocando) return
  
      audio.current ??= new AudioContext()
      const ctx = audio.current
      ctx.resume()
  
      let proximoClique = ctx.currentTime + 0.05
      let tempo = 0
      const timeouts: number[] = []
  
      const agendador = setInterval(() => {
        while (proximoClique < ctx.currentTime + JANELA_S) {
          tocarClique(ctx, proximoClique, tempo === 0)
  
          const esteTempo = tempo
          const atraso = (proximoClique - ctx.currentTime) * 1000
          timeouts.push(setTimeout(() => setTempoAtual(esteTempo), atraso))
  
          proximoClique += 60 / bpmRef.current
          tempo = (tempo + 1) % temposRef.current
        }
      }, INTERVALO_MS)
  
      return () => {
        clearInterval(agendador)
        timeouts.forEach(clearTimeout)
        setTempoAtual(-1)
      }
    }, [tocando])
  
    return { bpm, setBpm, tempos, setTempos, tocando, setTocando, tempoAtual }
  }

  function tocarClique(ctx: AudioContext, quando: number, acento: boolean) {
    const osc = ctx.createOscillator()
    const volume = ctx.createGain()
  
    osc.frequency.value = acento ? 1200 : 800
    volume.gain.setValueAtTime(0.6, quando)
    volume.gain.exponentialRampToValueAtTime(0.001, quando + 0.05)
  
    osc.connect(volume).connect(ctx.destination)
    osc.start(quando)
    osc.stop(quando + 0.05)
  }