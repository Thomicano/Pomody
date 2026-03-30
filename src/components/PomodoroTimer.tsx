import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(20)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let interval: number | undefined
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1)
        } else if (minutes > 0) {
          setMinutes(minutes - 1)
          setSeconds(59)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, minutes, seconds])

  const toggleTimer = () => setIsActive(!isActive)

  return (
    <Card className="w-[350px] border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
      <CardContent className="p-8 flex flex-col items-center">
        {/* Selector de Modos */}
        <Tabs defaultValue="pomodoro" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-transparent">
            <TabsTrigger value="pomodoro" className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Pomodoro</TabsTrigger>
            <TabsTrigger value="short" className="text-[10px] uppercase tracking-wider text-emerald-500 opacity-60">Descanso</TabsTrigger>
            <TabsTrigger value="long" className="text-[10px] uppercase tracking-wider text-emerald-500 opacity-60">Descanso largo</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Círculo del Temporizador */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Círculo de progreso (Estilizado) */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-50/50" />
            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={754} strokeDashoffset={754 * (1 - (minutes * 60 + seconds) / 1200)} className="text-blue-100 transition-all duration-1000" />
          </svg>
          
          <div className="text-center z-10">
            <span className="text-7xl font-light text-blue-600 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <div className="flex flex-col mt-2 text-blue-400">
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Nivel</span>
                <span className="text-xs font-bold">Popular</span>
            </div>
          </div>
        </div>

        {/* Botón Iniciar */}
        <Button 
          onClick={toggleTimer}
          className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold tracking-widest uppercase shadow-lg shadow-blue-200"
        >
          {isActive ? "Pausar" : "Iniciar"}
        </Button>
      </CardContent>
    </Card>
  )
}