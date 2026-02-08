import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {ClosureService} from "./closure.service";
import {CurrentUser} from "../auth/currentUser.decorator";
import type {AuthUser} from "../auth/authUser.model";

@Controller('closures')
@UseGuards(JwtAuthGuard)
export class ClosureController {
    constructor(private readonly closureService: ClosureService) {
    }

    @Post()
    async create(
        @CurrentUser() user: AuthUser,
        @Body() body: {amount: number; date: Date, accountId: number},
    ) {
        const closure = await this.closureService.create({
            ...body,
            userId: user.id,
        });
        return closure.id
    }
}
