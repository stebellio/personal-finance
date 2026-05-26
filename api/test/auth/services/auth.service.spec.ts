import { AuthService } from "../../../src/auth/services/auth.service";
import Mocked = jest.Mocked;
import { IAuthRepository } from "../../../src/auth/repositories/authRepository.interface";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("Auth - AuthService", () => {
  let service: AuthService;

  let mockRepository: Mocked<IAuthRepository>;
  let mockJwtService: Mocked<JwtService>;
  let mockConfigService: Mocked<ConfigService>;

  beforeEach(() => {
    mockRepository = mock<IAuthRepository>();
    mockJwtService = mock<JwtService>();
    mockConfigService = mock<ConfigService>();

    service = new AuthService(
      mockRepository,
      mockJwtService,
      mockConfigService,
    );
  });

  describe("validateUser", () => {
    it("should throw if user is not found", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser("email", "password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw if password is incorrect", async () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: "",
      });

      await expect(service.validateUser("email", "password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should return user when credentials are valid", async () => {
      const plainPassword = "password";
      const hashPassword = bcrypt.hashSync(plainPassword, 10);

      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: hashPassword,
      });

      await expect(
        service.validateUser("email", plainPassword),
      ).resolves.toEqual({
        id: 1,
        email: "email",
        password: hashPassword,
      });
    });
  });

  describe("login", () => {
    it("should return access and refresh tokens", () => {
      mockConfigService.getOrThrow.mockReturnValue("mock-value" as never);
      mockJwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = service.login({ id: 1, email: "user@test.com" });

      expect(result).toEqual({
        access_token: "access-token",
        refresh_token: "refresh-token",
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe("refresh", () => {
    it("should return new token pair when refresh token is valid", async () => {
      mockConfigService.getOrThrow.mockReturnValue("mock-secret" as never);
      mockJwtService.verify.mockReturnValue({
        id: 1,
        email: "user@test.com",
      } as never);
      mockRepository.findById.mockResolvedValue({
        id: 1,
        email: "user@test.com",
      });
      mockJwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");

      const result = await service.refresh("valid-refresh-token");

      expect(result).toEqual({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      });
    });

    it("should throw UnauthorizedException when token is invalid or expired", async () => {
      mockConfigService.getOrThrow.mockReturnValue("mock-secret" as never);
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(service.refresh("invalid-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when user no longer exists", async () => {
      mockConfigService.getOrThrow.mockReturnValue("mock-secret" as never);
      mockJwtService.verify.mockReturnValue({
        id: 99,
        email: "deleted@test.com",
      } as never);
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.refresh("orphan-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("register", () => {
    it("should throw ConflictException if user already exists", async () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: "password",
      });

      await expect(
        service.register({ email: "email", password: "password" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should hash password and create user", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      const bcryptjs = require("bcryptjs");
      jest.spyOn(bcryptjs, "hash").mockResolvedValue("hashedPassword");

      await service.register({ email: "email", password: "password" });

      expect(mockRepository.create).toHaveBeenCalledWith({
        email: "email",
        password: "hashedPassword",
      });
    });
  });
});
