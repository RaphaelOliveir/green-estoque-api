import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário e obter token JWT',
    description:
      'Realiza o login com e-mail e senha. Em caso de sucesso, retorna o token JWT a ser utilizado nas demais requisições no header `Authorization: Bearer <token>`.',
  })
  @ApiBody({ type: LoginDto, description: 'Credenciais de acesso' })
  @ApiResponse({
    status: 200,
    description:
      'Login realizado com sucesso. Retorna o token JWT e dados básicos do usuário.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas — e-mail ou senha incorretos.',
  })
  login(@Body() _dto: LoginDto, @CurrentUser() user: Omit<User, 'password'>) {
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna dados do usuário autenticado',
    description:
      'Retorna as informações do perfil do usuário atualmente autenticado via token JWT.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Dados do usuário autenticado retornados com sucesso (sem campo senha).',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado — token JWT ausente ou inválido.',
  })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
