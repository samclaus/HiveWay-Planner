
export const enum Rank {
    User,
    Admin,
}

export interface UserInfo {
    readonly id: string;
    readonly username: string;
    readonly rank: Rank;
    readonly name: string;
    readonly email?: string | undefined;
}