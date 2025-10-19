import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import {AuthGuard as PassportAuthGuard} from "@nestjs/passport";

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {}
