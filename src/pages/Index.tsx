import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AircraftConfig {
  name: string;
  compartments: string[];
  uldPositions: Record<string, string[]>;
}

interface CompartmentData {
  baggageCount?: number;
  cargoWeight?: number;
  bulkCargoWeight?: number;
  uldWeight?: number;
}

const AIRCRAFT_CONFIGS: Record<string, AircraftConfig> = {
  'A319': {
    name: 'Airbus A319',
    compartments: ['Compartment 1', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 3': ['31P', '32P', '33P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)']
    }
  },
  'A320': {
    name: 'Airbus A320',
    compartments: ['Compartment 1', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 3': ['31P', '32P', '33P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)']
    }
  },
  'A321': {
    name: 'Airbus A321',
    compartments: ['Compartment 1', 'Compartment 2', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 2': ['21P', '22P', '23P'],
      'Compartment 3': ['31P', '32P', '33P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)']
    }
  },
  'B737': {
    name: 'Boeing 737',
    compartments: ['Compartment 1', 'Compartment 2', 'Compartment 3', 'Compartment 4'],
    uldPositions: {
      'Compartment 1': ['1 (Bulk)'],
      'Compartment 2': ['2 (Bulk)'],
      'Compartment 3': ['3 (Bulk)'],
      'Compartment 4': ['4 (Bulk)']
    }
  }
};

export default function AircraftCargoManager() {
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [loadingType, setLoadingType] = useState<'bulk' | 'uld' | ''>('');
  const [averageBaggageWeight, setAverageBaggageWeight] = useState<number>(23);
  const [compartmentData, setCompartmentData] = useState<Record<string, CompartmentData>>({});
  const [uldWeights, setUldWeights] = useState<Record<string, number>>({});
  const [eicWeight, setEicWeight] = useState<number>(35);
  const [eicCompartment, setEicCompartment] = useState<string>('');

  const handleAircraftSelect = (aircraft: string) => {
    setSelectedAircraft(aircraft);
    setLoadingType('');
    setCompartmentData({});
    
    // Set default EIC values
    if (aircraft === 'B737') {
      setEicWeight(23);
      setEicCompartment('Compartment 4');
    } else {
      setEicWeight(35);
      setEicCompartment('Compartment 5');
    }
  };

  const handleLoadingTypeSelect = (type: 'bulk' | 'uld') => {
    setLoadingType(type);
    setCompartmentData({});
    setUldWeights({});
  };

  const updateCompartmentData = (compartment: string, field: keyof CompartmentData, value: number) => {
    setCompartmentData(prev => ({
      ...prev,
      [compartment]: {
        ...prev[compartment],
        [field]: value
      }
    }));
    
    // Auto-fill ULD weight to 65kg when baggage count is set to 0 in ULD mode
    if (loadingType === 'uld' && field === 'baggageCount' && value === 0) {
      const isUldPosition = !compartment.includes('Bulk');
      if (isUldPosition) {
        setUldWeights(prev => ({
          ...prev,
          [compartment]: 65
        }));
      }
    }
  };

  const calculateCompartmentWeight = (compartment: string): number => {
    if (!selectedAircraft) return 0;
    
    const aircraftConfig = AIRCRAFT_CONFIGS[selectedAircraft];
    const positions = aircraftConfig.uldPositions[compartment] || [];
    
    let baseWeight = 0;
    
    if (loadingType === 'bulk') {
      const data = compartmentData[compartment];
      if (data) {
        const baggageWeight = data.baggageCount ? data.baggageCount * averageBaggageWeight : 0;
        const cargoWeight = data.bulkCargoWeight || 0;
        baseWeight = baggageWeight + cargoWeight;
      }
    } else if (loadingType === 'uld') {
      positions.forEach(position => {
        const positionKey = `${compartment}-${position}`;
        const data = compartmentData[positionKey];
        const uldWeight = uldWeights[positionKey] || 0;
        
        if (data || uldWeight > 0) {
          const baggageWeight = data?.baggageCount ? data.baggageCount * averageBaggageWeight : 0;
          const cargoWeight = data?.cargoWeight || 0;
          const isUldPosition = !position.includes('Bulk');
          
          if (isUldPosition) {
            baseWeight += baggageWeight + cargoWeight + uldWeight;
          } else {
            baseWeight += baggageWeight + cargoWeight;
          }
        }
      });
    }
    
    // Add EIC weight if this compartment is the EIC compartment
    if (compartment === eicCompartment) {
      baseWeight += eicWeight;
    }
    
    return baseWeight;
  };

  const updateUldWeight = (positionKey: string, weight: number) => {
    setUldWeights(prev => ({
      ...prev,
      [positionKey]: weight
    }));
  };

  const calculateTotalWeight = (): number => {
    if (!selectedAircraft) return 0;
    
    return AIRCRAFT_CONFIGS[selectedAircraft].compartments.reduce((total, compartment) => {
      return total + calculateCompartmentWeight(compartment);
    }, 0);
  };

  const getCompartmentWeights = (): Array<{compartment: string, weight: number}> => {
    if (!selectedAircraft) return [];
    
    return AIRCRAFT_CONFIGS[selectedAircraft].compartments
      .map(compartment => ({
        compartment,
        weight: calculateCompartmentWeight(compartment)
      }))
      .filter(item => item.weight > 0);
  };

  const aircraftConfig = selectedAircraft ? AIRCRAFT_CONFIGS[selectedAircraft] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">✈️ Uçak Kargo Yöneticisi</h1>
          <p className="text-sm text-gray-600">Kargo ve bagaj yönetim sistemi</p>
          <p className="text-xs text-gray-400 opacity-60">Muhammed Enes İŞCAN tarafından geliştirildi</p>
        </div>

        {/* Aircraft Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Uçak Seçimi</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAircraft} onValueChange={handleAircraftSelect}>
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

        {/* Loading Type Selection */}
        {selectedAircraft && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Yükleme Tipi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={loadingType === 'bulk' ? 'default' : 'outline'}
                  onClick={() => handleLoadingTypeSelect('bulk')}
                  className="h-12"
                >
                  Bulk Yükleme
                </Button>
                <Button
                  variant={loadingType === 'uld' ? 'default' : 'outline'}
                  onClick={() => handleLoadingTypeSelect('uld')}
                  className="h-12"
                >
                  ULD Yükleme
                </Button>
              </div>
              
              {(loadingType === 'bulk' || loadingType === 'uld') && (
                <div className="pt-3 border-t">
                  <Label htmlFor="avgWeight" className="text-sm font-medium">
                    Ortalama Bagaj Ağırlığı (kg)
                  </Label>
                  <Input
                    id="avgWeight"
                    type="number"
                    value={averageBaggageWeight}
                    onChange={(e) => setAverageBaggageWeight(Number(e.target.value))}
                    className="mt-1"
                    min="1"
                    max="50"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Compartments */}
        {selectedAircraft && loadingType && aircraftConfig && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                Kompartmanlar
                <Badge variant="secondary" className="text-xs">
                  {aircraftConfig.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aircraftConfig.compartments.map((compartment, index) => (
                <div key={compartment} className="p-4 border rounded-lg bg-white/50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{compartment}</h3>
                    <Badge variant="outline" className="text-xs">
                      {calculateCompartmentWeight(compartment).toFixed(1)} kg
                    </Badge>
                  </div>
                  
                  {loadingType === 'bulk' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`baggage-${index}`} className="text-sm">
                          Bagaj Sayısı
                        </Label>
                        <Input
                          id={`baggage-${index}`}
                          type="number"
                          value={compartmentData[compartment]?.baggageCount || ''}
                          onChange={(e) => updateCompartmentData(compartment, 'baggageCount', Number(e.target.value))}
                          className="mt-1"
                          placeholder=""
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`bulk-cargo-${index}`} className="text-sm">
                          Kargo Ağırlığı (kg)
                        </Label>
                        <Input
                          id={`bulk-cargo-${index}`}
                          type="number"
                          value={compartmentData[compartment]?.bulkCargoWeight || ''}
                          onChange={(e) => updateCompartmentData(compartment, 'bulkCargoWeight', Number(e.target.value))}
                          className="mt-1"
                          placeholder=""
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {loadingType === 'uld' && aircraftConfig && (
                    <div className="space-y-4">
                      <div className="pb-2 border-b border-gray-200">
                        <Label className="text-sm font-medium text-gray-700">
                          Ortalama Bagaj Ağırlığı: {averageBaggageWeight} kg
                        </Label>
                      </div>
                      {aircraftConfig.uldPositions[compartment]?.map((position) => {
                        const positionKey = `${compartment}-${position}`;
                        const isUldPosition = !position.includes('Bulk');
                        
                        return (
                          <div key={position} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                            <h4 className="font-medium text-sm mb-2 text-gray-700">{position}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`baggage-${positionKey}`} className="text-xs">
                                  Bagaj Sayısı
                                </Label>
                                <Input
                                  id={`baggage-${positionKey}`}
                                  type="number"
                                  value={compartmentData[positionKey]?.baggageCount || ''}
                                  onChange={(e) => updateCompartmentData(positionKey, 'baggageCount', Number(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                  placeholder=""
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`cargo-${positionKey}`} className="text-xs">
                                  Kargo (kg)
                                </Label>
                                <Input
                                  id={`cargo-${positionKey}`}
                                  type="number"
                                  value={compartmentData[positionKey]?.cargoWeight || ''}
                                  onChange={(e) => updateCompartmentData(positionKey, 'cargoWeight', Number(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                  placeholder=""
                                  min="0"
                                />
                              </div>
                            </div>
                            {isUldPosition && (
                              <div className="mt-2">
                                <Label htmlFor={`uld-${positionKey}`} className="text-xs">
                                  ULD Ağırlığı (kg)
                                </Label>
                                <Input
                                  id={`uld-${positionKey}`}
                                  type="number"
                                  value={uldWeights[positionKey] || ''}
                                  onChange={(e) => updateUldWeight(positionKey, Number(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                  placeholder=""
                                  min="0"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <Separator />

              {/* EIC Settings */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">EIC Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="eic-weight" className="text-xs">EIC Ağırlığı (kg)</Label>
                      <Input
                        id="eic-weight"
                        type="number"
                        value={eicWeight}
                        onChange={(e) => setEicWeight(Number(e.target.value))}
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

              {/* Compartment Weights and Total */}
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                {getCompartmentWeights().map(({compartment, weight}) => (
                  <div key={compartment} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {compartment}
                      {compartment === eicCompartment && ' (EIC dahil)'}
                    </span>
                    <span className="font-medium">{weight.toFixed(1)} kg</span>
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
        )}

        {!selectedAircraft && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-4xl">🛫</div>
              <p className="text-gray-600">
                Başlamak için yukarıdan bir uçak modeli seçin
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}