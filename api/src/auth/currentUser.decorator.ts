import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "./models/authUser.model";

export const CurrentUser = createParamDecorator(
  (unknown, ctx: ExecutionContext) => {
    const request: { user: AuthUser } = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
