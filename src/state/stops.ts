import { uuidv4 } from "../lib/uuid";
import { rx } from "../rx";

export const enum StopType {
    StopOrPlatform,
    Station,
    EntranceOrExit,
    GenericNode,
    BoardingArea,
}

export const enum WheelchairBoarding {
    Unspecified,
    Some,
    None,
}

export interface StopSpec {
    id?: string;
    code: string;
    name: string;
    name_tts: string;
    desc?: string;
    lat: number;
    lng: number;
    zone_id?: string;
    url?: string;
    type: StopType;
    parent_station?: string;
    timezone?: string;
    wheelchair_boarding: WheelchairBoarding;
    level_id?: string;
    platform_code?: string;
}

export interface StopInfo extends StopSpec {
    id: string;
}

export const STOP_TYPES: readonly string[] & { readonly [T in StopType]: string } = [
    "Stop (or Platform)",
    "Station",
    "Entrance/Exit",
    "Pathway Intersection",
    "Boarding Area",
];

// TODO: once UI is finished, persist in database
const stops: StopInfo[] = [];

export const STOPS = new rx.UniversalSet<StopInfo>(
    () => Promise.resolve(stops),
    () => Promise.reject("TODO: no API to refresh one item yet"),
    5 * 60_000,
);

export async function createStop(spec: StopSpec): Promise<void> {
    STOPS.$set({
        id: uuidv4(),
        ...spec,
    });
}

export async function deleteStop(id: string): Promise<void> {
    STOPS.$delete(id);
}
