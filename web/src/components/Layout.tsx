import { NavLink, Outlet, useLocation } from 'react-router'
import { CalendarDays, Guitar, Library, Metronome, TrendingUp, AudioWaveform, Music } from 'lucide-react'
import { APP_NAME } from '@/lib/config'
import { motion } from 'motion/react'
import { ProvedorDeAudio } from './ProvedorDeAudio'
import { PainelFlutuante } from './PainelFlutuante'

const menu = [
    { para: '/', rotulo: 'Hoje', icone: Guitar },
    { para: '/agenda', rotulo: 'Agenda', icone: CalendarDays },
    { para: '/metronomo', rotulo: 'Metrônomo', icone: Metronome },
    { para: '/biblioteca', rotulo: 'Biblioteca', icone: Library },
    { para: '/progresso', rotulo: 'Progresso', icone: TrendingUp },
    { para: '/afinador', rotulo: 'Afinador', icone: AudioWaveform },
    { para: '/escalas', rotulo: 'Escalas', icone: Music },
]

export function Layout() {

    const location = useLocation()

    return (
        <ProvedorDeAudio>
            <div className="min-h-screen md:flex">
                {/* Menu lateral */}
                <aside className="hidden md:flex md:w-56 md:flex-col md:gap-10 md:border-r md:px-4 md:py-8">
                    <span className="px-3 font-heading text-lg font-semibold tracking-tight font-stretch-expanded">{APP_NAME}</span>
                    <nav className="flex flex-col gap-0.5">
                        {menu.map((item) => (
                            <NavLink
                                key={item.para}
                                to={item.para}
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icone className="size-4" />
                                        {item.rotulo}
                                        {isActive && <span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Conteúdo principal */}
                <main className="flex-1 px-5 pt-8 pb-28 md:px-12 md:py-12">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
                {/* Menu inferior para telas pequenas */}
                <nav className="fixed inset-x-0 bottom-0 flex border-t bg-card md:hidden">
                    {menu.map((item) => (
                        <NavLink
                            key={item.para}
                            to={item.para}
                            end
                            className={({ isActive }) =>
                                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
                                }`
                            }
                        >
                            <item.icone className='size-5' />
                            {item.rotulo}
                        </NavLink>
                    ))}
                </nav>
                <PainelFlutuante />
            </div>
        </ProvedorDeAudio>
    )
}