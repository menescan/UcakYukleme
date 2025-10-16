import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type AircraftCompartmentHeights = {
  [key: string]: {
    compartments: { [key: string]: string | string[] }
    notes?: string[]
  }
}

const compartmentHeights: AircraftCompartmentHeights = {
  'A319': {
    compartments: {
      '1': '1.24',
      '4': '1.24 - 1.20',
      '5': '0.82'
    }
  },
  'A320': {
    compartments: {
      '1': '1.24',
      '3': '1.24',
      '4': '1.24 - 1.20',
      '5': '0.82'
    }
  },
  'A321': {
    compartments: {
      '1': '1.24',
      '2': '1.24',
      '3': '1.24',
      '4': ['1.24', '1.20'],
      '5': '0.82'
    }
  },
  'A330': {
    compartments: {
      '1': '1.71',
      '2': '1.71',
      '3': '1.67',
      '4': '1.67',
      '5': ['1.79', '1.81', '1.5']
    }
  },
  'A350': {
    compartments: {
      '1': '1.76',
      '2': '1.76',
      '3': '1.75',
      '4': '1.75',
      '5': '1.76'
    },
    notes: ['52 ve 53\'e atılmaz']
  },
  'B737': {
    compartments: {
      '1': '1.11',
      '2': '1.11',
      '3': '1.19',
      '4': ['0.95', '0.59']
    }
  },
  'B787': {
    compartments: {
      '1': '1.70',
      '2': '1.70',
      '3': '1.70',
      '4': '1.70',
      '5': ['1.70', '1.49']
    },
    notes: ['52 ve 53\'e atılmaz']
  },
  'B777': {
    compartments: {
      '1': '1.67',
      '2': '1.67',
      '3': '1.67',
      '4': '1.67',
      '5': ['1.67', '1.56']
    },
    notes: ['52 ve 53\'e atılmaz']
  }
}

const getTIDistance = (ti: number): number => {
  if (ti <= 0) return 0
  if (ti <= 1.0) return 0.30
  if (ti <= 2.0) return 0.50
  if (ti <= 3.0) return 0.70
  if (ti <= 4.0) return 0.85
  if (ti <= 5.0) return 1.00
  if (ti <= 6.0) return 1.15
  if (ti <= 7.0) return 1.30
  if (ti <= 8.0) return 1.45
  if (ti <= 9.0) return 1.55
  if (ti <= 10.0) return 1.65
  if (ti <= 11.0) return 1.75
  return 1.75
}

export function RadioactiveCheck() {
  const [aircraft, setAircraft] = useState('')
  const [compartment, setCompartment] = useState('')
  const [ti, setTi] = useState('')
  const [boxHeight, setBoxHeight] = useState('')
  const [boxHeightUnit, setBoxHeightUnit] = useState('cm')
  
  const parseBoxHeight = (value: string): number | null => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return null
    
    if (value.toLowerCase().includes('m')) {
      return numValue * 100
    }
    return numValue
  }
  
  const handleBoxHeightChange = (value: string) => {
    // Sadece sayılar, nokta ve m/cm karakterlerine izin ver
    const cleanValue = value.replace(/[^0-9.mc]/gi, '')
    setBoxHeight(cleanValue)
    
    if (cleanValue.toLowerCase().includes('m')) {
      setBoxHeightUnit('m')
    } else {
      setBoxHeightUnit('cm')
    }
  }
  
  const calculateClearance = () => {
    if (!aircraft || !compartment || !ti || !boxHeight) return null
    
    const tiValue = parseFloat(ti)
    const boxHeightCm = parseBoxHeight(boxHeight)
    
    if (!boxHeightCm) return 'Geçerli bir boyut giriniz'
    
    const tiDistance = getTIDistance(tiValue)
    const totalRequiredSpace = (tiDistance * 100) + boxHeightCm
    
    const compartmentHeight = compartmentHeights[aircraft]?.compartments[compartment]
    if (!compartmentHeight) return 'Bu bölüm uçakta yok veya atılmaz'

    const heights = Array.isArray(compartmentHeight) 
      ? compartmentHeight 
      : [compartmentHeight]

    const results = heights.map(height => {
      const minHeight = parseFloat(height) * 100
      const clearance = minHeight - totalRequiredSpace
      return {
        height: minHeight,
        clearance,
        formula: `${totalRequiredSpace.toFixed(0)} cm < ${minHeight.toFixed(0)} cm`
      }
    })

    const resultMessages = results.map(result => 
      result.clearance > 0
        ? `${result.height/100}m için: ${result.clearance.toFixed(0)} cm ile kurtarıyor (${result.formula})`
        : `${result.height/100}m için: Bu yükseklikte atılamaz (${result.formula})`
    )

    return resultMessages.join('\n')
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Radyoaktif İndeks Kontrol</CardTitle>
        <CardDescription>Kompartman yükseklik kontrolü</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aircraft">Uçak</Label>
              <Select value={aircraft} onValueChange={setAircraft}>
                <SelectTrigger>
                  <SelectValue placeholder="Uçak seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(compartmentHeights).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="compartment">Hold</Label>
              <Select value={compartment} onValueChange={setCompartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Hold seçin" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft && Object.keys(compartmentHeights[aircraft].compartments).map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="ti">Toplam İndeks</Label>
            <Input
              id="ti"
              placeholder="0.1-11.0"
              value={ti}
              onChange={(e) => setTi(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="boxHeight">Kargo Boyu ({boxHeightUnit})</Label>
            <div className="relative">
              <Input
                id="boxHeight"
                placeholder={`Örn: 20${boxHeightUnit}`}
                value={boxHeight}
                onChange={(e) => handleBoxHeightChange(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Select value={boxHeightUnit} onValueChange={setBoxHeightUnit}>
                  <SelectTrigger className="w-[60px] border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {boxHeight && parseBoxHeight(boxHeight) !== null && (
                `≈ ${parseBoxHeight(boxHeight)?.toFixed(0)} cm`
              )}
            </div>
          </div>
          <div className="text-sm space-y-2">
            {calculateClearance()?.split('\n')?.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 rounded",
                  message.includes('kurtarıyor')
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {message}
              </div>
            ))}
            {aircraft && compartment === '5' && compartmentHeights[aircraft].notes?.map((note, index) => (
              <div key={index} className="text-gray-500 italic text-xs">
                {note}
              </div>
            ))}
          </div>
          {compartmentHeights[aircraft]?.notes && (
            <div className="text-sm text-gray-500 italic">
              {compartmentHeights[aircraft].notes.map((note, i) => (
                <div key={i}>{note}</div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
