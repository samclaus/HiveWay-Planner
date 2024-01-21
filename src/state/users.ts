import { decode, encode } from "msgpack-ts";
import { rx } from "../rx";
import { request } from "./session";
import type { Rank, UserInfo } from "../backend/user";

export const RANK_NAMES: { readonly [R in Rank]: string } = [
    "Normal User",
    "Admin",
    "Root Admin",
];

export const USERS = new rx.UniversalSet<UserInfo>(
    () => request('user:list').then(decode),
    () => Promise.reject("TODO: no API to refresh one item yet"),
    5 * 60_000,
);

export async function deleteUser(id: string): Promise<void> {
    await request('user:delete', encode(id));
    USERS.$delete(id);
}
