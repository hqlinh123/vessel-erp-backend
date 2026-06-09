// src/auth/dto/register-company.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
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
    message:
      'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  subdomain!: string;

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
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;
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
