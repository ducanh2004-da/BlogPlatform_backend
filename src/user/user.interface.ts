import { UserReturn } from "src/common/models/user";
export interface IUserService {
    getUserById(userId: string): Promise<UserReturn>;
}
export const USER_TOKEN = 'IUser';
