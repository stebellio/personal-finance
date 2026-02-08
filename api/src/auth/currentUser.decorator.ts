import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import {AuthUser} from "./authUser.model";

export const CurrentUser = createParamDecorator(
    ( unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as AuthUser;
    },
);