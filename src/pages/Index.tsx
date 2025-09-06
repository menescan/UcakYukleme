import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const WATER_INDEXES = {
  'B737 800': {
    '%25': ['-117', '-2,5'],
    '%50': ['-117', '-1,7'],
    '%75': ['-59', '-0,8'],
  },
  'B737 900': {
    '%25': ['-178', '-2,7'],
    '%50': ['-119', '-1,8'],
    '%75': ['-59', '-0,9'],
  },
  'A319': {
    '%25': ['-150', '-1,7'],
    '%50': ['-100', '-1,1'],
    '%75': ['-50', '-0,6'],
  },
  'A320': {
    '%25': ['-150', '+0,5'],
    '%50': ['-100', '+0,3'],
    '%75': ['-50', '+0,2'],
  },
  'A321': {
    '%25': ['-150', '-2,3'],
    '%50': ['-100', '-1,6'],
    '%75': ['-50', '-0,8'],
  },
};

const AIRCRAFT_CONFIGS = {
  'A319': {
    name: 'Airbus A319',
    compartments: ['Compartment 1', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 3': ['31P', '32P'],
      'Compartment 4': ['41P', '42P'],
      'Compartment 5': ['5 (Bulk)'],
    },
  },
  'A320': {
    name: 'Airbus A320',
    compartments: ['Compartment 1', 'Compartment 3', 'Compartment 4', 'Compartment 5'],
    uldPositions: {
      'Compartment 1': ['11P', '12P'],
      'Compartment 3': ['31P', '32P', '33P'],
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
};

interface CompartmentData {
  baggageCount?: number;
  bulkCargoWeight?: number;
  cargoWeight?: number;
}

export default function AircraftCargoManager() {
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [loadingType, setLoadingType] = useState('');
  const [averageBaggageWeight, setAverageBaggageWeight] = useState<number | ''>('');
  const [compartmentData, setCompartmentData] = useState<Record<string, CompartmentData>>({});
  const [uldWeights, setUldWeights] = useState<Record<string, number>>({});
  const [eicWeight, setEicWeight] = useState(35);
  const [eicCompartment, setEicCompartment] = useState('');
  const [selectedWaterPercent, setSelectedWaterPercent] = useState('');

  const handleAircraftSelect = (aircraft: string) => {
    setSelectedAircraft(aircraft);
    setLoadingType('');
    setCompartmentData({});
    if (aircraft === 'B737') {
      setEicWeight(23);
      setEicCompartment('Compartment 4');
    } else {
      setEicWeight(35);
      setEicCompartment('Compartment 5');
    }
  };

  const handleLoadingTypeSelect = (type: string) => {
    setLoadingType(type);
    setCompartmentData({});
    setUldWeights({});
  };

  // ULD pozisyonlarında bagaj veya kargo girildiğinde ULD ağırlığı otomatik 65 atanır
  const updateCompartmentData = (compartment: string, field: keyof CompartmentData, value: number) => {
    setCompartmentData(prev => {
      const newData = {
        ...prev,
        [compartment]: {
          ...prev[compartment],
          [field]: value,
        },
      };
      // ULD yükleme ve pozisyon ise, bagaj veya kargo girildiyse ULD ağırlığı 65 olarak atanır
      if (loadingType === 'uld' && (field === 'baggageCount' || field === 'cargoWeight')) {
        const isUldPosition = compartment.includes('-') && !compartment.includes('Bulk');
        if (isUldPosition && value > 0) {
          setUldWeights(prevUld => ({ ...prevUld, [compartment]: 65 }));
        }
      }
      return newData;
    });
  };

  const calculateCompartmentWeight = (compartment: string): number => {
    if (!selectedAircraft) return 0;
    const aircraftConfig = AIRCRAFT_CONFIGS[selectedAircraft];
    const positions = aircraftConfig.uldPositions[compartment] || [];
    let baseWeight = 0;
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
        let uldWeight = uldWeights[positionKey];
        // Eğer uldWeight yoksa ve bagaj/kargo girildiyse otomatik 65
        if ((data?.baggageCount || data?.cargoWeight) && (!uldWeight || uldWeight === 0)) {
          uldWeight = 65;
        }
        const baggageWeight = data?.baggageCount && averageBaggageWeight !== '' ? data.baggageCount * Number(averageBaggageWeight) : 0;
        const cargoWeight = data?.cargoWeight || 0;
        baseWeight += baggageWeight + cargoWeight + (uldWeight || 0);
      });
    }
    if (compartment === eicCompartment) {
      baseWeight += eicWeight;
    }
    return baseWeight;
  };

  const calculateTotalWeight = (): number => {
    if (!selectedAircraft) return 0;
    return AIRCRAFT_CONFIGS[selectedAircraft].compartments.reduce(
      (total, compartment) => total + calculateCompartmentWeight(compartment),
      0
    );
  };

  const getWaterIndexKey = (): string => {
    if (selectedAircraft === 'B737') return 'B737 800';
    return selectedAircraft;
  };

  const aircraftConfig = selectedAircraft ? AIRCRAFT_CONFIGS[selectedAircraft] : null;
  const isB737Selected = selectedAircraft === 'B737';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">✈️ Uçak Kargo Yöneticisi</h1>
          <p className="text-sm text-gray-600">Balans hesaplama yardım sistemi</p>
          <p className="text-xs text-gray-400 opacity-60">Muhammed Enes İŞCAN tarafından geliştirildi</p>
        </div>
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
                {/* B737 için ULD yükleme seçeneği gösterilmez */}
                {selectedAircraft !== 'B737' && (
                  <Button
                    variant={loadingType === 'uld' ? 'default' : 'outline'}
                    onClick={() => handleLoadingTypeSelect('uld')}
                    className="h-12"
                  >
                    ULD Yükleme
                  </Button>
                )}
              </div>
              {/* Ortalama bagaj ağırlığı inputu her iki tipte de gösterilir */}
              {(loadingType === 'bulk' || (loadingType === 'uld' && selectedAircraft !== 'B737')) && (
                <div className="pt-3 border-t">
                  <Label htmlFor="avgWeight" className="text-sm font-medium">
                    Ortalama Bagaj Ağırlığı (kg)
                  </Label>
                  <Input
                    id="avgWeight"
                    type="number"
                    value={averageBaggageWeight === '' ? '' : averageBaggageWeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setAverageBaggageWeight('');
                      } else {
                        const num = Number(val);
                        setAverageBaggageWeight(isNaN(num) ? '' : num);
                      }
                    }}
                    className="mt-1"
                    min="1"
                    max="50"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {selectedAircraft && (
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
                    onClick={() => setSelectedWaterPercent(percent)}
                  >
                    {percent}
                  </Button>
                ))}
              </div>
              {selectedWaterPercent && (
                <div className="p-3 bg-blue-100 rounded-md">
                  <div className="font-semibold mb-2">Su İndeksleri</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-200">
                        <th className="p-1">Uçak</th>
                        <th className="p-1">%25</th>
                        <th className="p-1">%50</th>
                        <th className="p-1">%75</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(WATER_INDEXES).map(([model]) => (
                        <tr
                          key={model}
                          className={
                            isB737Selected && (model === 'B737 800' || model === 'B737 900')
                              ? 'bg-blue-50 font-bold'
                              : getWaterIndexKey() === model
                              ? 'bg-blue-50 font-bold'
                              : ''
                          }
                        >
                          <td className="p-1">{model}</td>
                          {['%25', '%50', '%75'].map((percent) => (
                            <td className="p-1" key={percent}>
                              {WATER_INDEXES[model][percent]?.join(' / ')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-blue-900">
                    <span className="font-medium">Seçili Uçak:</span> {getWaterIndexKey()}<br />
                    <span className="font-medium">Seçili Yüzde:</span> {selectedWaterPercent}<br />
                    <span className="font-medium">İndeks:</span> {WATER_INDEXES[getWaterIndexKey()][selectedWaterPercent]?.join(' / ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {selectedAircraft && loadingType && aircraftConfig && (
          <>
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
                {aircraftConfig.compartments.map((compartment, index) => {
                  let positions = aircraftConfig.uldPositions[compartment];
                  if (selectedAircraft === 'A319' && compartment === 'Compartment 3' && positions) {
                    positions = positions.filter(pos => pos !== '33P');
                  }
                  // B737 için ULD inputlarını ve ULD yükleme formunu gösterme
                  if (selectedAircraft === 'B737' && loadingType === 'uld') return null;
                  return (
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
                            <Label htmlFor={`baggage-${index}`} className="text-sm">Bagaj Sayısı</Label>
                            <Input
                              id={`baggage-${index}`}
                              type="number"
                              value={compartmentData[compartment]?.baggageCount || ''}
                              onChange={(e) => updateCompartmentData(compartment, 'baggageCount', Number(e.target.value))}
                              className="mt-1"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`bulk-cargo-${index}`} className="text-sm">Kargo Ağırlığı (kg)</Label>
                            <Input
                              id={`bulk-cargo-${index}`}
                              type="number"
                              value={compartmentData[compartment]?.bulkCargoWeight || ''}
                              onChange={(e) => updateCompartmentData(compartment, 'bulkCargoWeight', Number(e.target.value))}
                              className="mt-1"
                              min="0"
                            />
                          </div>
                        </div>
                      )}
                      {loadingType === 'uld' && positions && selectedAircraft !== 'B737' && (
                        <div className="space-y-4">
                          {positions.map((position) => {
                            const positionKey = `${compartment}-${position}`;
                            const isUldPosition = !position.includes('Bulk');
                            return (
                              <div key={position} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                <h4 className="font-medium text-sm mb-2 text-gray-700">{position}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor={`baggage-${positionKey}`} className="text-xs">Bagaj Sayısı</Label>
                                    <Input
                                      id={`baggage-${positionKey}`}
                                      type="number"
                                      value={compartmentData[positionKey]?.baggageCount ?? ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateCompartmentData(positionKey, 'baggageCount', val);
                                        // Bagaj/kargo girildiyse veya 0 girildiyse ULD ağırlığı otomatik 65
                                        if ((val >= 0) && (!uldWeights[positionKey] || uldWeights[positionKey] === 0)) {
                                          setUldWeights(prev => ({ ...prev, [positionKey]: 65 }));
                                        }
                                      }}
                                      className="mt-1 h-8 text-sm"
                                      min="0"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`cargo-${positionKey}`} className="text-xs">Kargo (kg)</Label>
                                    <Input
                                      id={`cargo-${positionKey}`}
                                      type="number"
                                      value={compartmentData[positionKey]?.cargoWeight ?? ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateCompartmentData(positionKey, 'cargoWeight', val);
                                        if ((val >= 0) && (!uldWeights[positionKey] || uldWeights[positionKey] === 0)) {
                                          setUldWeights(prev => ({ ...prev, [positionKey]: 65 }));
                                        }
                                      }}
                                      className="mt-1 h-8 text-sm"
                                      min="0"
                                    />
                                  </div>
                                </div>
                                {isUldPosition && (
                                  <div className="mt-2">
                                    <Label htmlFor={`uld-${positionKey}`} className="text-xs">ULD Ağırlığı (kg)</Label>
                                    <Input
                                      id={`uld-${positionKey}`}
                                      type="number"
                                      value={uldWeights[positionKey] ?? ''}
                                      onChange={(e) => {
                                        let val = Number(e.target.value);
                                        // 0 girilirse yine 65 olarak dahil edilsin
                                        if (val === 0) val = 65;
                                        setUldWeights(prev => ({ ...prev, [positionKey]: val }));
                                      }}
                                      className="mt-1 h-8 text-sm"
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
                  );
                })}
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 mt-4">
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
                        {aircraftConfig.compartments.map((compartment) => (
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
            <Card className="mt-4">
              <CardContent>
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                  {aircraftConfig.compartments
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
          </>
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