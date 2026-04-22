import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  getKey(@Param('key') key: string) {
    return this.settingsService.getKey(key);
  }

  @Put()
  update(@Body() body: Record<string, unknown>) {
    return this.settingsService.update(body);
  }
}
