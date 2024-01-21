import { decode, encode } from "msgpack-ts";
import { rx } from "../rx";
import { request } from "./session";

export interface RegistrationTokenSpec {
	// The ID of the token IS the token, i.e., what users see/use.
	id: string;
	// Rank is the rank that will be granted to the user who registers with the token.
	rank: number;
	name: string;
	// Notes is just generic text entered by the admin that created the
	// token. Useful for mentioning who the token is intended  for.
	notes: string;
}

// RegistrationTokenInfo describes a registration token. Tokens are created by admins
// to permit new users to register. Every token is single-use.
export interface RegistrationTokenInfo extends RegistrationTokenSpec {
	// CreatedAt is the timestamp from when the token was created, in Unix milliseconds.
	created_at: number;
	// CreatedBy is the ID of the admin that created the token.
	created_by: string;
}

export const REGISTRATION_TOKENS = new rx.UniversalSet<RegistrationTokenInfo>(
    () => request('registration_token:list').then(decode),
    () => Promise.reject("TODO: no API to refresh one item yet"),
    5 * 60_000,
);

export async function createRegistrationToken(spec: RegistrationTokenSpec): Promise<void> {
    REGISTRATION_TOKENS.$set(
        decode<RegistrationTokenInfo>(
            await request('registration_token:create', encode(spec)),
        ),
    );
}

export async function deleteRegistrationToken(id: string): Promise<void> {
    await request('registration_token:delete', encode(id));
    REGISTRATION_TOKENS.$delete(id);
}
