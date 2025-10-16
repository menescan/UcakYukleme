'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioactiveCheck } from '@/components/ui/radioactive-check';

const WATER_INDEXES = {
  'B737 800': {
    '%25': ['-177', '-2.5'],
    '%50': ['-118', '-1.7'],
    '%75': ['-59', '-0.8'],
  },
  'B737 900': {
    '%25': ['-178', '-2.7'],
    '%50': ['-119', '-1.8'],
    '%75': ['-59', '-0.9'],
  },
  'A319': {
    '%25': ['-150', '-1.7'],
    '%50': ['-100', '-1.1'],
    '%75': ['-50', '-0.6'],
  },
  'A320': {
    '%25': ['-150', '+0.5'],
    '%50': ['-100', '+0.3'],
    '%75': ['-50', '+0.2'],
  },
  'A321': {
    '%25': ['-150', '-2.3'],
    '%50': ['-100', '-1.6'],
    '%75': ['-50', '-0.8'],
  },
} as const;

const AIRCRAFT_CONFIGS = {
  'A319': {
    name: 'Airbus A319',
    compartments: ['Compartment 1', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)'],
    },
  },
  'A320': {
    name: 'Airbus A320',
    compartments: ['Compartment 1', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P', '13P'],
      'Compartment 3': ['31P', '32P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)'],
    },
  },
  'A321': {
    name: 'Airbus A321',
    compartments: ['Compartment 1', 'Compartment 2', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 2': ['21P', '22P', '23P'],
      'Compartment 3': ['31P', '32P', '33P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)'],
    },
  },
  'B737': {
    name: 'Boeing 737',
    compartments: ['Compartment 1', 'Compartment 2', 'Compartment 3', 'Compartment 4'],
    uldPositions: {
      'Compartment 1': ['1 (Bulk)'],
      'Compartment 2': ['2 (Bulk)'],
      'Compartment 3': ['3 (Bulk)'],
      'Compartment 4': ['4 (Bulk)'],
    },
  },
} as const;

interface CompartmentData {
  baggageCount?: number;
  bulkCargoWeight?: number;
  cargoWeight?: number;
}

type AircraftConfig = typeof AIRCRAFT_CONFIGS[keyof typeof AIRCRAFT_CONFIGS];

const Header = React.memo(() => (
  <div className="text-center space-y-2">
    <h1 className="text-2xl font-bold text-gray-900">✈️ Uçak Kargo Yöneticisi</h1>
    <p className="text-sm text-gray-600">Balans hesaplama yardım sistemi</p>
    <p className="text-xs text-gray-400 opacity-60">Muhammed Enes İŞCAN tarafından geliştirildi</p>
  </div>
));
Header.displayName = 'Header';

interface AirportSelectorProps {
  iataCode: string;
  setIataCode: React.Dispatch<React.SetStateAction<string>>;
  airportInfo: { name: string; country: string } | null;
  setAirportInfo: React.Dispatch<React.SetStateAction<{ name: string; country: string } | null>>;
}
const AirportSelector: React.FC<AirportSelectorProps> = React.memo(({ iataCode, setIataCode, airportInfo, setAirportInfo }) => (
  <div className="flex gap-2 items-center bg-white/50 px-3 py-2 rounded-lg shadow-sm">
    <div className="flex-shrink-0">
      <Input
        value={iataCode}
        onChange={(e) => {
          const code = e.target.value.toUpperCase();
          setIataCode(code);
          if (code.length === 3) {
            fetch('/iata.xlsx.csv')
              .then(response => response.text())
              .then(csv => {
                const lines = csv.split('\n');
                const airport = lines
                  .slice(1)
                  .map(line => {
                    const [name, country, iata] = line.split(',');
                    return { name, country, iata: iata?.trim() };
                  })
                  .find(a => a.iata === code);
                setAirportInfo(airport ? { name: airport.name, country: airport.country } : null);
              });
          }
        }}
        placeholder="IATA"
        className="w-16 h-7 text-xs"
        maxLength={3}
        style={{ textTransform: 'uppercase' }}
      />
    </div>
    {airportInfo && (
      <Badge variant="outline" className="text-xs font-normal">
        {airportInfo.name}, {airportInfo.country}
      </Badge>
    )}
  </div>
));
AirportSelector.displayName = 'AirportSelector';

interface AircraftSelectorProps {
  selectedAircraft: keyof typeof AIRCRAFT_CONFIGS | '';
  onAircraftSelect: (aircraft: string) => void;
}
const AircraftSelector: React.FC<AircraftSelectorProps> = React.memo(({ selectedAircraft, onAircraftSelect }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Uçak Seçimi</CardTitle>
    </CardHeader>
    <CardContent>
      <Select value={selectedAircraft} onValueChange={onAircraftSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Uçak modelini seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A319">Airbus A319</SelectItem>
          <SelectItem value="A320">Airbus A320</SelectItem>
          <SelectItem value="A321">Airbus A321</SelectItem>
          <SelectItem value="B737">Boeing 737</SelectItem>
        </SelectContent>
      </Select>
    </CardContent>
  </Card>
));
AircraftSelector.displayName = 'AircraftSelector';

interface LoadingTypeSelectorProps {
  loadingType: string;
  selectedAircraft: keyof typeof AIRCRAFT_CONFIGS | '';
  planBaggageCount: number | '';
  planBaggageWeight: number | '';
  averageBaggageWeight: number | '';
  onLoadingTypeSelect: (type: string) => void;
  setPlanBaggageCount: React.Dispatch<React.SetStateAction<number | ''>>;
  setPlanBaggageWeight: React.Dispatch<React.SetStateAction<number | ''>>;
  setAverageBaggageWeight: React.Dispatch<React.SetStateAction<number | ''>>;
}
const LoadingTypeSelector: React.FC<LoadingTypeSelectorProps> = React.memo(({
  loadingType, selectedAircraft, planBaggageCount, planBaggageWeight, averageBaggageWeight,
  onLoadingTypeSelect, setPlanBaggageCount, setPlanBaggageWeight, setAverageBaggageWeight
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Yükleme Tipi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={loadingType === 'bulk' ? 'default' : 'outline'}
          onClick={() => onLoadingTypeSelect('bulk')}
          className="h-12"
          type="button"
        >
          Bulk Yükleme
        </Button>
        {selectedAircraft !== 'B737' && (
          <Button
            variant={loadingType === 'uld' ? 'default' : 'outline'}
            onClick={() => onLoadingTypeSelect('uld')}
            className="h-12"
            type="button"
          >
            ULD Yükleme
          </Button>
        )}
      </div>
      {loadingType && (
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Toplam Bagaj Sayısı</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={planBaggageCount}
                onChange={(e) => {
                  const value = e.target.value;
                  setPlanBaggageCount(value === '' ? '' : Number(value));
                }}
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Toplam Bagaj Ağırlığı (kg)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                step="0.1"
                value={planBaggageWeight}
                onChange={(e) => {
                  const value = e.target.value;
                  setPlanBaggageWeight(value === '' ? '' : Number(value));
                }}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="avg-baggage-weight" className="text-xs">Ortalama Bagaj Ağırlığı (kg)</Label>
            <Input
              id="avg-baggage-weight"
              type="number"
              inputMode="numeric"
              min="0"
              step="0.1"
              value={averageBaggageWeight}
              onChange={(e) => {
                const value = e.target.value;
                const avg = value === '' ? '' : Number(value);
                setAverageBaggageWeight(avg);
                if (avg !== '' && planBaggageCount !== '') {
                  setPlanBaggageWeight(avg * Number(planBaggageCount));
                } else if (avg === '') {
                  setPlanBaggageWeight('');
                }
              }}
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
));
LoadingTypeSelector.displayName = 'LoadingTypeSelector';

interface WaterPercentSelectorProps {
  selectedWaterPercent: string;
  selectedAircraft: keyof typeof AIRCRAFT_CONFIGS | '';
  onWaterPercentSelect: (percent: string) => void;
}
const WaterPercentSelector: React.FC<WaterPercentSelectorProps> = React.memo(({ selectedWaterPercent, selectedAircraft, onWaterPercentSelect }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Su Yüzdesi Seçimi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex gap-2 mb-4">
        {['%25', '%50', '%75'].map((percent) => (
          <Button
            key={percent}
            variant={selectedWaterPercent === percent ? 'default' : 'outline'}
            onClick={() => onWaterPercentSelect(percent)}
          >
            {percent}
          </Button>
        ))}
      </div>
      {selectedWaterPercent && selectedAircraft && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left text-sm">Uçak</th>
                <th className="border border-gray-200 px-4 py-2 text-left text-sm">Yüzde</th>
                <th className="border border-gray-200 px-4 py-2 text-left text-sm">İndeks / MAC</th>
              </tr>
            </thead>
            <tbody>
              {selectedAircraft === 'B737' ? (
                <>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm">B737 800</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">{selectedWaterPercent}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      {WATER_INDEXES['B737 800'][selectedWaterPercent as '%25' | '%50' | '%75']?.join(' / ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm">B737 900</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">{selectedWaterPercent}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      {WATER_INDEXES['B737 900'][selectedWaterPercent as '%25' | '%50' | '%75']?.join(' / ')}
                    </td>
                  </tr>
                </>
              ) : selectedAircraft ? (
                <tr>
                  <td className="border border-gray-200 px-4 py-2 text-sm">{selectedAircraft}</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">{selectedWaterPercent}</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">
                    {WATER_INDEXES[selectedAircraft][selectedWaterPercent as '%25' | '%50' | '%75']?.join(' / ')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
));
WaterPercentSelector.displayName = 'WaterPercentSelector';

interface CompartmentsSectionProps {
  aircraftConfig: AircraftConfig | null;
  loadingType: string;
  compartmentData: Record<string, CompartmentData>;
  uldWeights: Record<string, number>;
  emptyUldPositions: Record<string, boolean>;
  calculateCompartmentWeight: (compartment: string) => number;
  updateCompartmentData: (compartment: string, field: keyof CompartmentData, value: number) => void;
  setUldWeights: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setEmptyUldPositions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}
const CompartmentsSection: React.FC<CompartmentsSectionProps> = React.memo(({
  aircraftConfig, loadingType, compartmentData, uldWeights, emptyUldPositions,
  calculateCompartmentWeight, updateCompartmentData, setUldWeights, setEmptyUldPositions
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex justify-between items-center">
        Kompartmanlar
        <Badge variant="secondary" className="text-xs">
          {aircraftConfig?.name}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {aircraftConfig?.compartments.map((compartment) => (
        <div key={compartment} className="p-4 border rounded-lg bg-white/50 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">{compartment}</h3>
            <Badge variant="outline" className="text-xs">
              {calculateCompartmentWeight(compartment).toFixed(1)} kg
            </Badge>
          </div>
          
          {loadingType === 'bulk' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bagaj Sayısı</Label>
                  <div className="flex mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const currentCount = compartmentData[compartment]?.baggageCount || 0;
                        if (currentCount > 0) {
                          updateCompartmentData(compartment, 'baggageCount', currentCount - 1);
                        }
                      }}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={compartmentData[compartment]?.baggageCount || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCompartmentData(compartment, 'baggageCount', Number(value));
                      }}
                      className="h-8 text-sm text-center mx-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const currentCount = compartmentData[compartment]?.baggageCount || 0;
                        updateCompartmentData(compartment, 'baggageCount', currentCount + 1);
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Kargo Ağırlığı (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={compartmentData[compartment]?.bulkCargoWeight || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateCompartmentData(compartment, 'bulkCargoWeight', Number(value));
                    }}
                    className="h-8 text-sm mt-1"
                  />
                </div>
              </div>
            </div>
          ) : loadingType === 'uld' && aircraftConfig?.uldPositions[compartment] ? (
            <div className="space-y-4 mt-3">
              {aircraftConfig.uldPositions[compartment].map((position) => {
                const positionKey = `${compartment}-${position}`;
                const isEmpty = emptyUldPositions[positionKey];
                
                return (
                  <div key={position} className="border p-3 rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{position}</span>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs" htmlFor={`empty-${positionKey}`}>Boş AKH</Label>
                        <Switch
                          id={`empty-${positionKey}`}
                          checked={isEmpty}
                          onCheckedChange={(checked) => {
                            setEmptyUldPositions(prev => ({ ...prev, [positionKey]: checked }));
                            if (checked) {
                              updateCompartmentData(positionKey, 'baggageCount', 0);
                              updateCompartmentData(positionKey, 'cargoWeight', 0);
                              setUldWeights(prev => ({ ...prev, [positionKey]: 65 }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Bagaj Sayısı</Label>
                          <div className="flex mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                const currentCount = compartmentData[positionKey]?.baggageCount || 0;
                                if (currentCount > 0) {
                                  updateCompartmentData(positionKey, 'baggageCount', currentCount - 1);
                                }
                              }}
                              disabled={isEmpty}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={compartmentData[positionKey]?.baggageCount || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateCompartmentData(positionKey, 'baggageCount', Number(value));
                              }}
                              className="h-8 text-sm text-center mx-1"
                              disabled={isEmpty}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                const currentCount = compartmentData[positionKey]?.baggageCount || 0;
                                updateCompartmentData(positionKey, 'baggageCount', currentCount + 1);
                              }}
                              disabled={isEmpty}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Kargo Ağırlığı (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={compartmentData[positionKey]?.cargoWeight || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateCompartmentData(positionKey, 'cargoWeight', Number(value));
                            }}
                            className="h-8 text-sm mt-1"
                            disabled={isEmpty}
                          />
                        </div>
                      </div>
                      {!position.includes('Bulk') && compartment !== 'Compartment 5' && (
                        <div>
                          <Label className="text-xs">ULD Ağırlığı (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={uldWeights[positionKey] ?? (isEmpty ? '65' : '')}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setUldWeights(prev => {
                                  const newState = { ...prev };
                                  delete newState[positionKey];
                                  return newState;
                                });
                              } else {
                                const newWeight = Number(value);
                                if (!isNaN(newWeight)) {
                                  setUldWeights(prev => ({ ...prev, [positionKey]: newWeight }));
                                }
                              }
                            }}
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </CardContent>
  </Card>
));
CompartmentsSection.displayName = 'CompartmentsSection';

interface EICSettingsProps {
  eicWeight: number;
  eicCompartment: string;
  aircraftConfig: AircraftConfig | null;
  setEicWeight: React.Dispatch<React.SetStateAction<number>>;
  setEicCompartment: React.Dispatch<React.SetStateAction<string>>;
}
const EICSettings: React.FC<EICSettingsProps> = React.memo(({ eicWeight, eicCompartment, aircraftConfig, setEicWeight, setEicCompartment }) => (
  <Card className="bg-green-50 border-green-200">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm">EIC Ayarları</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="eic-weight" className="text-xs">EIC Ağırlığı (kg)</Label>
          <Input
            id="eic-weight"
            type="number"
            value={eicWeight}
            onChange={(e) => {
              const value = e.target.value;
              setEicWeight(Number(value));
            }}
            className="mt-1 h-8 text-sm"
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="eic-compartment" className="text-xs">EIC Kompartmanı</Label>
          <Select value={eicCompartment} onValueChange={setEicCompartment}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {aircraftConfig?.compartments.map((compartment) => (
                <SelectItem key={compartment} value={compartment}>
                  {compartment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
));
EICSettings.displayName = 'EICSettings';

interface WeightSummaryProps {
  aircraftConfig: AircraftConfig | null;
  eicCompartment: string;
  calculateTotalWeight: () => number;
  calculateCompartmentWeight: (compartment: string) => number;
}
const WeightSummary: React.FC<WeightSummaryProps> = React.memo(({ aircraftConfig, eicCompartment, calculateTotalWeight, calculateCompartmentWeight }) => (
  <Card>
    <CardContent>
      <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
        {aircraftConfig?.compartments
          .filter((compartment) => calculateCompartmentWeight(compartment) > 0)
          .map((compartment) => (
            <div key={compartment} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {compartment}
                {compartment === eicCompartment && ' (EIC dahil)'}
              </span>
              <span className="font-medium">
                {calculateCompartmentWeight(compartment).toFixed(1)} kg
              </span>
            </div>
          ))}
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Toplam:</span>
          <Badge className="text-base px-3 py-1">
            {calculateTotalWeight().toFixed(1)} kg
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
));
WeightSummary.displayName = 'WeightSummary';

const Index = () => {
  const [selectedAircraft, setSelectedAircraft] = useState<keyof typeof AIRCRAFT_CONFIGS | '' > ('');
  const [loadingType, setLoadingType] = useState('');
  const [planBaggageCount, setPlanBaggageCount] = useState<number | '' > ('');
  const [planBaggageWeight, setPlanBaggageWeight] = useState<number | '' > ('');
  const [averageBaggageWeight, setAverageBaggageWeight] = useState<number | '' > ('');
  const [compartmentData, setCompartmentData] = useState<Record<string, CompartmentData>>({});
  const [uldWeights, setUldWeights] = useState<Record<string, number>>({});
  const [eicWeight, setEicWeight] = useState(35);
  const [eicCompartment, setEicCompartment] = useState('');
  const [selectedWaterPercent, setSelectedWaterPercent] = useState('');
  const [iataCode, setIataCode] = useState("");
  const [airportInfo, setAirportInfo] = useState<{ name: string; country: string } | null>(null);
  const [emptyUldPositions, setEmptyUldPositions] = useState<Record<string, boolean>>({});

  const aircraftConfig = useMemo(() => selectedAircraft ? AIRCRAFT_CONFIGS[selectedAircraft] : null, [selectedAircraft]);

  const handleAircraftSelect = useCallback((aircraft: string) => {
    const ac = aircraft as keyof typeof AIRCRAFT_CONFIGS | '';
    setSelectedAircraft(ac);
    setLoadingType('');
    setCompartmentData({});
    setPlanBaggageWeight('');
    setPlanBaggageCount('');
    setAverageBaggageWeight('');
    setEmptyUldPositions({});
    if (ac === 'B737') {
      setEicWeight(23);
      setEicCompartment('Compartment 4');
    } else {
      setEicWeight(35);
      setEicCompartment('Compartment 5');
    }
  }, []);

  const handleLoadingTypeSelect = useCallback((type: string) => {
    setLoadingType(type);
    setCompartmentData({});
    setUldWeights({});
    setPlanBaggageWeight('');
    setPlanBaggageCount('');
    setAverageBaggageWeight('');
  }, []);

  const updateCompartmentData = useCallback((compartment: string, field: keyof CompartmentData, value: number) => {
    setCompartmentData(prev => {
      const newData = {
        ...prev,
        [compartment]: {
          ...prev[compartment],
          [field]: value,
        },
      };

      if (loadingType === 'uld' && (field === 'baggageCount' || field === 'cargoWeight')) {
        const isUldPosition = compartment.includes('-') && !compartment.includes('Bulk');
        const isCompartment5Position = compartment.includes('Compartment 5-');
        const isAirbusAircraft = ['A319', 'A320', 'A321'].includes(selectedAircraft);

        if (isUldPosition && !isCompartment5Position && value > 0) {
          setUldWeights(prevUld => ({ ...prevUld, [compartment]: 65 }));
        } else if (isCompartment5Position && isAirbusAircraft) {
          setUldWeights(prevUld => ({ ...prevUld, [compartment]: 0 }));
        }
      }
      return newData;
    });
  }, [loadingType, selectedAircraft]);

  const calculateCompartmentWeight = useCallback((compartment: string): number => {
    if (!selectedAircraft || !aircraftConfig) return 0;
    const positions = aircraftConfig.uldPositions[compartment] || [];
    let baseWeight = 0;

    const isCompartment5 = compartment === 'Compartment 5' && ['A319', 'A320', 'A321'].includes(selectedAircraft);

    if (loadingType === 'bulk') {
      const data = compartmentData[compartment];
      if (data) {
        const baggageWeight = data.baggageCount && averageBaggageWeight !== '' ? data.baggageCount * Number(averageBaggageWeight) : 0;
        const cargoWeight = data.bulkCargoWeight || 0;
        baseWeight = baggageWeight + cargoWeight;
      }
    } else if (loadingType === 'uld') {
      positions.forEach(position => {
        const positionKey = `${compartment}-${position}`;
        const data = compartmentData[positionKey];
        
        const baggageWeight = data?.baggageCount && averageBaggageWeight !== '' ? data.baggageCount * Number(averageBaggageWeight) : 0;
        const cargoWeight = data?.cargoWeight || 0;

        let uldWeight = 0;
        if (!isCompartment5 && !position.includes('Bulk')) {
          uldWeight = uldWeights[positionKey] ?? 0;
          if ((baggageWeight > 0 || cargoWeight > 0) && uldWeight === 0) {
            uldWeight = 65;
          }
        }

        baseWeight += baggageWeight + cargoWeight + uldWeight;
      });
    }
    
    if (compartment === eicCompartment) {
      baseWeight += eicWeight;
    }
    return baseWeight;
  }, [selectedAircraft, aircraftConfig, loadingType, compartmentData, averageBaggageWeight, uldWeights, eicCompartment, eicWeight]);

  const calculateTotalWeight = useCallback((): number => {
    if (!selectedAircraft || !aircraftConfig) return 0;
    return aircraftConfig.compartments.reduce(
      (total, compartment) => total + calculateCompartmentWeight(compartment),
      0
    );
  }, [selectedAircraft, aircraftConfig, calculateCompartmentWeight]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Header />
        <AirportSelector iataCode={iataCode} setIataCode={setIataCode} airportInfo={airportInfo} setAirportInfo={setAirportInfo} />
        <AircraftSelector selectedAircraft={selectedAircraft} onAircraftSelect={handleAircraftSelect} />
        {selectedAircraft && (
          <>
            <LoadingTypeSelector
              loadingType={loadingType}
              selectedAircraft={selectedAircraft}
              planBaggageCount={planBaggageCount}
              planBaggageWeight={planBaggageWeight}
              averageBaggageWeight={averageBaggageWeight}
              onLoadingTypeSelect={handleLoadingTypeSelect}
              setPlanBaggageCount={setPlanBaggageCount}
              setPlanBaggageWeight={setPlanBaggageWeight}
              setAverageBaggageWeight={setAverageBaggageWeight}
            />
            <WaterPercentSelector
              selectedWaterPercent={selectedWaterPercent}
              selectedAircraft={selectedAircraft}
              onWaterPercentSelect={setSelectedWaterPercent}
            />
            {loadingType && (
              <>
                <CompartmentsSection
                  aircraftConfig={aircraftConfig}
                  loadingType={loadingType}
                  compartmentData={compartmentData}
                  uldWeights={uldWeights}
                  emptyUldPositions={emptyUldPositions}
                  calculateCompartmentWeight={calculateCompartmentWeight}
                  updateCompartmentData={updateCompartmentData}
                  setUldWeights={setUldWeights}
                  setEmptyUldPositions={setEmptyUldPositions}
                />
                <EICSettings
                  eicWeight={eicWeight}
                  eicCompartment={eicCompartment}
                  aircraftConfig={aircraftConfig}
                  setEicWeight={setEicWeight}
                  setEicCompartment={setEicCompartment}
                />
                <WeightSummary
                  aircraftConfig={aircraftConfig}
                  eicCompartment={eicCompartment}
                  calculateTotalWeight={calculateTotalWeight}
                  calculateCompartmentWeight={calculateCompartmentWeight}
                />
                <div className="mt-4">
                  <RadioactiveCheck />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;