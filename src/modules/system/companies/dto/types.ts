// src/auth/dto/register-company.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsUrl,
} from 'class-validator';


export class RegisterCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Matches(/^[A-Z0-9]{2,10}$/, {
    message: 'Company code must be 2-10 uppercase letters or numbers',
  })
  companyCode!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  subdomain!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'Phone number contains invalid characters',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Primary color must be a valid hex color code (e.g., #FF0000)',
  })
  primaryColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  adminPassword!: string;
}

// src/auth/dto/auth-response.dto.ts
export class ResponseDto {
  success!: boolean;
  message!: string;
  data?: {
    company: {
      id: string;
      name: string;
      code: string;
      subdomain: string;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      userType: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  subdomain?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName!: string;

  @IsUUID()
  @IsNotEmpty()
  roleId!: string;

  @IsString()
  @IsOptional()
  message?: string;
}

export class InviteResponseDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  inviteUrl!: string;

  @IsString()
  @IsNotEmpty()
  expiresAt!: string;
}