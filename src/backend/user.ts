
export const enum Role {
    User,
    Admin,
}

export interface UserInfo {
    readonly id: string;
    readonly username: string;
    readonly role: Role;
    readonly name: string;
    readonly email?: string | undefined;
}