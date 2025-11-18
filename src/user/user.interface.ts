import { UserReturn,UserResponse } from "src/common/models/user";
export interface IUserService {
    getUserById(userId: string): Promise<UserReturn>;
    getAllUser(): Promise<UserResponse[]>
}
export const USER_TOKEN = 'IUser';
