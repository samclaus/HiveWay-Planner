
export const enum Rank {
    User,
    Admin,
    Root,
}

export interface UserInfo {
    readonly id: string;
    readonly username: string;
    readonly rank: Rank;
    readonly name: string;
    readonly email?: string | undefined;
}