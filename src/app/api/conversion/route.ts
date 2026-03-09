import { NextRequest, NextResponse } from 'next/server';

type UnitCategory = 'length' | 'mass' | 'temperature' | 'volume';

interface UnitDefinition {
  category: UnitCategory;
  aliases: string[];
  toBase?: (value: number) => number;
  fromBase?: (value: number) => number;
  factor?: number;
  label: string;
}

const UNITS: Record<string, UnitDefinition> = {
  mm: { category: 'length', aliases: ['mm', 'millimeter', 'millimeters'], factor: 0.001, label: 'mm' },
  cm: { category: 'length', aliases: ['cm', 'centimeter', 'centimeters'], factor: 0.01, label: 'cm' },
  m: { category: 'length', aliases: ['m', 'meter', 'meters'], factor: 1, label: 'm' },
  km: { category: 'length', aliases: ['km', 'kilometer', 'kilometers'], factor: 1000, label: 'km' },
  in: { category: 'length', aliases: ['in', 'inch', 'inches'], factor: 0.0254, label: 'in' },
  ft: { category: 'length', aliases: ['ft', 'foot', 'feet'], factor: 0.3048, label: 'ft' },
  yd: { category: 'length', aliases: ['yd', 'yard', 'yards'], factor: 0.9144, label: 'yd' },
  mi: { category: 'length', aliases: ['mi', 'mile', 'miles'], factor: 1609.344, label: 'mi' },
  g: { category: 'mass', aliases: ['g', 'gram', 'grams'], factor: 1, label: 'g' },
  kg: { category: 'mass', aliases: ['kg', 'kilogram', 'kilograms'], factor: 1000, label: 'kg' },
  lb: { category: 'mass', aliases: ['lb', 'lbs', 'pound', 'pounds'], factor: 453.59237, label: 'lb' },
  oz: { category: 'mass', aliases: ['oz', 'ounce', 'ounces'], factor: 28.349523125, label: 'oz' },
  l: { category: 'volume', aliases: ['l', 'liter', 'liters'], factor: 1, label: 'L' },
  ml: { category: 'volume', aliases: ['ml', 'milliliter', 'milliliters'], factor: 0.001, label: 'mL' },
  gal: { category: 'volume', aliases: ['gal', 'gallon', 'gallons'], factor: 3.78541, label: 'gal' },
  c: { category: 'temperature', aliases: ['c', '°c', 'celsius'], toBase: value => value, fromBase: value => value, label: '°C' },
  f: { category: 'temperature', aliases: ['f', '°f', 'fahrenheit'], toBase: value => ((value - 32) * 5) / 9, fromBase: value => (value * 9) / 5 + 32, label: '°F' },
  k: { category: 'temperature', aliases: ['k', 'kelvin'], toBase: value => value - 273.15, fromBase: value => value + 273.15, label: 'K' },
};

function findUnit(token: string): [string, UnitDefinition] | undefined {
  const normalized = token.trim().toLowerCase();
  return Object.entries(UNITS).find(([, unit]) => unit.aliases.includes(normalized));
}

function parseQuery(query: string) {
  const match = query.toLowerCase().match(/(-?\d+(?:\.\d+)?)\s*([a-z°]+)\s*(?:to|in|into)\s*([a-z°]+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  const fromEntry = findUnit(match[2]);
  const toEntry = findUnit(match[3]);
  if (!fromEntry || !toEntry) return null;
  const [fromKey, fromUnit] = fromEntry;
  const [toKey, toUnit] = toEntry;
  if (fromUnit.category !== toUnit.category) return null;
  return { value, fromKey, fromUnit, toKey, toUnit };
}

function convert(value: number, from: UnitDefinition, to: UnitDefinition): number {
  if (from.category === 'temperature' && from.toBase && to.fromBase) {
    return to.fromBase(from.toBase(value));
  }
  const base = value * (from.factor || 1);
  return base / (to.factor || 1);
}

function formatValue(value: number): string {
  return Math.abs(value) >= 100 ? value.toFixed(2) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const parsed = parseQuery(query);
    if (!parsed) {
      return NextResponse.json({ error: 'Could not parse that conversion.' }, { status: 400 });
    }

    const converted = convert(parsed.value, parsed.fromUnit, parsed.toUnit);
    const quickTargets = Object.values(UNITS)
      .filter(unit => unit.category === parsed.fromUnit.category && unit.label !== parsed.toUnit.label)
      .slice(0, 4)
      .map(unit => ({
        label: unit.label,
        value: `${formatValue(convert(parsed.value, parsed.fromUnit, unit))} ${unit.label}`,
      }));

    return NextResponse.json({
      category: parsed.fromUnit.category.charAt(0).toUpperCase() + parsed.fromUnit.category.slice(1),
      inputLabel: `${parsed.value} ${parsed.fromUnit.label}`,
      primaryResult: `${formatValue(converted)} ${parsed.toUnit.label}`,
      formula: parsed.fromUnit.category === 'temperature' ? 'Temperature is converted through Celsius as the shared base.' : `Converted using ${parsed.fromUnit.label} → base unit → ${parsed.toUnit.label}.`,
      quickResults: quickTargets,
      sourceLabel: 'Arcus unit engine',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Conversion failed.' }, { status: 500 });
  }
}
