import { useEffect, useRef, useState } from 'react'

export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const ACORDES = [
    { id: 'tonica', nome: 'Tônica', intervalos: [0] },
    { id: 'quinta', nome: 'Quinta', intervalos: [0, 7] },
    { id: 'maior', nome: 'Maior', intervalos: [0, 4, 7] },
    { id: 'menor', nome: 'Menor', intervalos: [0, 3, 7] },
]

export const TIMBRES: { id: OscillatorType; nome: string }[] = [
    { id: 'sine', nome: 'Suave' },
    { id: 'triangle', nome: 'Quente' },
    { id: 'sawtooth', nome: 'Brilhante' },
]

const DO_GRAVE = 48   // número da nota C3 no padrão MIDI .A  nota de partida: C3. Todas as tônicas ficam entre C3 e B3, região média-grave da guitarra. Não tem export: só este arquivo usa.

function frequencia(nota: number) {
    return 440 * 2 ** ((nota - 69) / 12)
}

export function useDrone() {
    const [tocando, setTocando] = useState(false)
    const [tonica, setTonica] = useState(4)   // E (Mi)
    const [acorde, setAcorde] = useState(ACORDES[0])
    const [timbre, setTimbre] = useState(TIMBRES[1])
    const [volume, setVolume] = useState(0.4)

    const audio = useRef<AudioContext | null>(null)
    const mestre = useRef<GainNode | null>(null)

    useEffect(() => {
        const ctx = new AudioContext()
        const ganho = ctx.createGain()
        ganho.connect(ctx.destination)
        audio.current = ctx
        mestre.current = ganho
        return () => {
            ctx.close()
        }
    }, [])

    useEffect(() => {
        const ctx = audio.current
        if (!ctx || !mestre.current) return
        mestre.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.05)
    }, [volume])

    useEffect(() => {
        const ctx = audio.current
        const saida = mestre.current
        
        if (!tocando || !ctx || !saida) return
        ctx.resume()

        const filtro = ctx.createBiquadFilter()
        filtro.frequency.value = 1500

        const ganho = ctx.createGain()
        ganho.gain.value = 0
        ganho.gain.setTargetAtTime(1 / acorde.intervalos.length, ctx.currentTime, 0.1)

        filtro.connect(ganho).connect(saida)

        const osciladores = acorde.intervalos.map((intervalo) => {
            const osc = ctx.createOscillator()
            osc.type = timbre.id
            osc.frequency.value = frequencia(DO_GRAVE + tonica + intervalo)
            osc.connect(filtro)
            osc.start()
            return osc
        })

        return () => {
            ganho.gain.setTargetAtTime(0, ctx.currentTime, 0.1)
            osciladores.forEach((osc) => osc.stop(ctx.currentTime + 0.5))
        }
    }, [tocando, tonica, acorde, timbre])

    return { tocando, setTocando, tonica, setTonica, acorde, setAcorde, timbre, setTimbre, volume, setVolume }
}