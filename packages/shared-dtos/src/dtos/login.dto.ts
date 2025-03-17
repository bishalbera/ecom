import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from "class-validator";

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email" })
  email: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  password: string;
}
