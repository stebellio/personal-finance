import { AuthService } from "../../../src/auth/services/auth.service";
import Mocked = jest.Mocked;
import { IAuthRepository } from "../../../src/auth/repositories/authRepository.interface";
import { JwtService } from "@nestjs/jwt";
import { mock } from "jest-mock-extended";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("Auth - AuthService", () => {
  let service: AuthService;

  let mockRepository: Mocked<IAuthRepository>;
  let mockJwtService: Mocked<JwtService>;

  beforeEach(() => {
    mockRepository = mock<IAuthRepository>();
    mockJwtService = mock<JwtService>();

    service = new AuthService(mockRepository, mockJwtService);
  });

  describe("validateUser", () => {
    it("should throw if user is not found", () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      void expect(service.validateUser("email", "password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw if password is incorrect", () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: "",
      });

      void expect(service.validateUser("email", "password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should return user", () => {
      const plainPassword = "password";
      const hashPassword = bcrypt.hashSync(plainPassword, 10);

      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: hashPassword,
      });

      void expect(
        service.validateUser("email", plainPassword),
      ).resolves.toEqual({
        id: 1,
        email: "email",
        password: hashPassword,
      });
    });
  });

  describe("register", () => {
    it("should throw if user already exists", () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "email",
        password: "password",
      });

      void expect(
        service.register({ email: "email", password: "password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should create user", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-unsafe-assignment
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
