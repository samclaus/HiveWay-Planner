import { decode, encode } from "msgpack-ts";
import { rx } from "../rx";
import { request } from "./session";

export interface ProjectSpec {
	/** Name of the project. */
	name: string;
	/** Description of the project (what it contains, purpose, etc.). */
	desc: string;
}

export interface ProjectInfo extends ProjectSpec {
	id: string;
	// CreatedAt is the timestamp from when the project was created, in Unix milliseconds.
	created_at: number;
	// CreatedBy is the ID of the user that created the project.
	created_by: string;
}

export interface ProjectChanges extends Partial<ProjectSpec> {
    id: string;
}

export const PROJECTS = new rx.UniversalSet<ProjectInfo>(
    () => request('project:list').then(decode),
    () => Promise.reject("TODO: no API to refresh one item yet"),
    5 * 60_000,
);

export async function createProject(spec: ProjectSpec): Promise<void> {
    PROJECTS.$set(
        decode<ProjectInfo>(
            await request('project:create', encode(spec)),
        ),
    );
}

export async function modifyProjectMetadata(changes: ProjectChanges): Promise<void> {
    PROJECTS.$set(
        decode<ProjectInfo>(
            await request('project:modify', encode(changes)),
        ),
    );
}

export async function deleteProject(id: string): Promise<void> {
    await request('project:delete', encode(id));
    PROJECTS.$delete(id);
}
