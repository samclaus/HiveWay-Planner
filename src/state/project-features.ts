import { decode, encode } from "msgpack-ts";
import { rx } from "../rx";
import { request } from "./session";

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

export interface GeometryStyles {
    stroke: boolean;
    color: string;
    weight: number;
    fill: boolean;
    fillColor: string | undefined;
    fillOpacity: number;
}

export interface PathSpec {
    line: boolean;
    coords: number[];
    name: string;
    styles: GeometryStyles;
}

export interface PathInfo extends PathSpec {
    id: string;
}

export interface CircleSpec {
    center: [number, number];
    radius_meters: number;
    name: string;
    styles: GeometryStyles;
}

export interface CircleInfo extends CircleSpec {
    id: string;
}

export interface ProjectFeatures {
    stops: StopInfo[];
    paths: PathInfo[];
    circles: CircleInfo[];
}

export const STOP_TYPES: readonly string[] & { readonly [T in StopType]: string } = [
    "Stop (or Platform)",
    "Station",
    "Entrance/Exit",
    "Pathway Intersection",
    "Boarding Area",
];

const features: ProjectFeatures = {
    stops: [],
    paths: [],
    circles: [],
};

export const PROJECT_FEATURES = new rx.MutableValue<ProjectFeatures>(features);

function removeItemWithID(arr: { id: unknown }[], id: string | number): void {
    const i = arr.findIndex(el => el.id === id);

    if (i >= 0) {
        arr.splice(i, 1);
    }
}

export async function refreshProjectFeatures(): Promise<void> {
    Object.assign(
        features,
        decode(await request("project:list_features")),
    );
    PROJECT_FEATURES.emit();
}

export async function createStop(spec: StopSpec): Promise<void> {
    // TODO: need to check array for existing info if a refresh happens just before
    // response comes back
    features.stops.push(
        decode(
            await request("stop:create", encode(spec)),
        ),
    );
    PROJECT_FEATURES.emit();
}

export async function deleteStop(id: string): Promise<void> {
    await request("stop:delete", encode(id));
    removeItemWithID(features.stops, id);
    PROJECT_FEATURES.emit();
}

export async function createPath(spec: PathSpec): Promise<void> {
    // TODO: need to check array for existing info if a refresh happens just before
    // response comes back
    features.paths.push(
        decode(
            await request("path:create", encode(spec)),
        ),
    );
    PROJECT_FEATURES.emit();
}

export async function deletePath(id: string): Promise<void> {
    await request("path:delete", encode(id));
    removeItemWithID(features.paths, id);
    PROJECT_FEATURES.emit();
}

export async function createCircle(spec: CircleSpec): Promise<void> {
    // TODO: need to check array for existing info if a refresh happens just before
    // response comes back
    features.circles.push(
        decode(
            await request("circle:create", encode(spec)),
        ),
    );
    PROJECT_FEATURES.emit();
}

export async function deleteCircle(id: string): Promise<void> {
    await request("circle:delete", encode(id));
    removeItemWithID(features.circles, id);
    PROJECT_FEATURES.emit();
}
