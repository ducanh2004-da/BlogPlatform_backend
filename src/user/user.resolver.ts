import { Args, Query, Resolver, Mutation, Context } from '@nestjs/graphql';
import { UserReturn } from 'src/common/models/user';
import { Inject, UseGuards} from '@nestjs/common';
import { IUserService, USER_TOKEN } from './user.interface';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver(() => UserReturn)
export class UserResolver {
    constructor(@Inject(USER_TOKEN) private readonly userService: IUserService){}

    @Query(() => UserReturn)
    async getUserById(@Args('userId') userId: string): Promise<UserReturn> {
        return this.userService.getUserById(userId);
    }

    @Query(() => UserReturn)
    @UseGuards(AuthGuard)
    async currentUser(@CurrentUser() user: any): Promise<UserReturn> {
        console.log('Current User ID:', user.sub);
        return this.userService.getUserById(user.sub);
    }
}
