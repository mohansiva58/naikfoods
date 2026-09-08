export interface SizeQuantityEntry {
    size: string;
    quantity: number;
}

type SizeQuantitySource =
    | string
    | Array<Partial<SizeQuantityEntry> & { count?: number }>
    | Record<string, unknown>
    | undefined
    | null;

function normalizeQuantity(value: unknown): number {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function pushEntry(entries: SizeQuantityEntry[], size: unknown, quantity: unknown): void {
    const normalizedSize = String(size || '').trim();
    const normalizedQuantity = normalizeQuantity(quantity);

    if (!normalizedSize || normalizedQuantity <= 0) {
        return;
    }

    const existing = entries.find((entry) => entry.size.toLowerCase() === normalizedSize.toLowerCase());
    if (existing) {
        existing.quantity += normalizedQuantity;
        return;
    }

    entries.push({ size: normalizedSize, quantity: normalizedQuantity });
}

function parseStringInput(value: string): SizeQuantityEntry[] {
    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        return parseSizeQuantities(parsed);
    } catch {
        return trimmed.split(',').flatMap((segment) => {
            const [sizePart, quantityPart] = segment.split('=');
            const [altSizePart, altQuantityPart] = segment.split(':');
            const size = (sizePart || altSizePart || '').trim();
            const quantity = normalizeQuantity(quantityPart ?? altQuantityPart);
            return size && quantity > 0 ? [{ size, quantity }] : [];
        });
    }
}

export function parseSizeQuantities(raw: SizeQuantitySource): SizeQuantityEntry[] {
    const entries: SizeQuantityEntry[] = [];

    if (!raw) {
        return entries;
    }

    if (typeof raw === 'string') {
        return parseStringInput(raw);
    }

    if (Array.isArray(raw)) {
        for (const item of raw) {
            if (!item || typeof item !== 'object') {
                continue;
            }

            const source = item as Partial<SizeQuantityEntry> & { count?: number };
            pushEntry(entries, source.size, source.quantity ?? source.count);
        }

        return entries;
    }

    for (const [size, quantity] of Object.entries(raw)) {
        pushEntry(entries, size, quantity);
    }

    return entries;
}

export function resolveSizeQuantities(input: {
    size?: unknown;
    quantity?: unknown;
    sizeQuantities?: SizeQuantitySource;
    sizeCounts?: SizeQuantitySource;
}): SizeQuantityEntry[] {
    const bulkEntries = parseSizeQuantities(input.sizeQuantities ?? input.sizeCounts);
    if (bulkEntries.length > 0) {
        return bulkEntries;
    }

    const size = String(input.size || '').trim();
    const quantity = normalizeQuantity(input.quantity ?? 1) || 1;

    if (!size) {
        return [];
    }

    return [{ size, quantity }];
}